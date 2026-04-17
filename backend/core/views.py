from rest_framework import status as http_status, generics, viewsets, permissions, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import CustomUser, LeaveRequest, QueueBooking, ClassSchedule, RescheduleRequest, LostFoundItem, Notification, Attendance, StudentMark, AuditLog
from .utils import check_schedule_conflict, find_matches
from .permissions import IsAdmin
from .serializers import (
    CustomUserSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordChangeSerializer,
    LeaveRequestSerializer,
    LeaveReviewSerializer,
    QueueBookingSerializer,
    ClassScheduleSerializer,
    RescheduleRequestSerializer,
    LostFoundItemSerializer,
    NotificationSerializer,
    AttendanceSerializer,
    StudentMarkSerializer,
    AdminUserSerializer,
    AuditLogSerializer,
)


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _log_audit(actor, action, target_user=None, details=None, ip=None):
    AuditLog.objects.create(
        actor=actor,
        target_user=target_user,
        action=action,
        details=details or {},
        ip_address=ip,
    )

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role
            }
        }, status=http_status.HTTP_201_CREATED)

class DashboardStatsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Admin only"}, status=403)
            
        data = {
            "students": CustomUser.objects.filter(role='student').count(),
            "faculty": CustomUser.objects.filter(role='faculty').count(),
            "leaves": LeaveRequest.objects.filter(status='pending').count(),
            "bookings": QueueBooking.objects.filter(
                preferred_date=timezone.now().date()
            ).count(),
        }
        return Response(data)

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
                "email": user.email
            }
        })

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self):
        return self.request.user


class PasswordChangeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Invalidate old token, issue new one to keep the session live
        Token.objects.filter(user=request.user).delete()
        token = Token.objects.create(user=request.user)
        return Response({'detail': 'Password changed successfully.', 'token': token.key})

class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return LeaveRequest.objects.all().order_by('-created_at')
        return LeaveRequest.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise permissions.PermissionDenied("Only students can apply for leaves.")
        serializer.save(student=self.request.user)

class AdminLeaveReviewView(generics.UpdateAPIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveReviewSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        if request.user.role != 'admin':
            return Response({"error": "Only admins can review leaves."}, status=http_status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

class QueueBookingViewSet(viewsets.ModelViewSet):
    serializer_class = QueueBookingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            date_param = self.request.query_params.get('date')
            queryset = QueueBooking.objects.all()
            if date_param:
                queryset = queryset.filter(preferred_date=date_param)
            return queryset.order_by('time_slot', 'token_number')
        return QueueBooking.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise permissions.PermissionDenied("Only students can book queue slots.")
            
        # Check slot availability (max 10)
        date = self.request.data.get('preferred_date')
        slot = self.request.data.get('time_slot')
        count = QueueBooking.objects.filter(preferred_date=date, time_slot=slot, status__in=['booked', 'in_progress']).count()
        if count >= 10:
            raise drf_serializers.ValidationError("This time slot is fully booked. Please choose another.")
            
        serializer.save(student=self.request.user)

class QueueSlotAvailabilityView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        date = request.query_params.get('date')
        if not date:
            return Response({"error": "Date parameter is required."}, status=400)
        
        slots = [
            '09:00-10:00', '10:00-11:00', '11:00-12:00', 
            '12:00-13:00', '14:00-15:00', '15:00-16:00'
        ]
        availability = []
        for slot in slots:
            count = QueueBooking.objects.filter(preferred_date=date, time_slot=slot, status__in=['booked', 'in_progress']).count()
            availability.append({
                "slot": slot,
                "remaining": 10 - count
            })
        return Response(availability)

class ClassScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = ClassScheduleSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        day = self.request.query_params.get('day')
        section = self.request.query_params.get('section')
        semester = self.request.query_params.get('semester')
        queryset = ClassSchedule.objects.filter(is_active=True)

        # Faculty only see their own assigned classes
        if user.role == 'faculty':
            queryset = queryset.filter(faculty=user)

        if day: queryset = queryset.filter(day_of_week=day)
        if section: queryset = queryset.filter(section=section)
        if semester: queryset = queryset.filter(semester=semester)
        return queryset.order_by('day_of_week', 'start_time')

    def destroy(self, request, *args, **kwargs):
        """Perform a hard delete as requested."""
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Only admins can delete schedules.")
        instance = self.get_object()
        instance.delete()
        return Response(status=http_status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        if self.request.user.role != 'admin':
            raise permissions.PermissionDenied("Only admins can manage schedules.")
        
        # Conflict Check
        data = self.request.data
        conflict, msg = check_schedule_conflict(
            day=data.get('day_of_week'),
            start=data.get('start_time'),
            end=data.get('end_time'),
            room=data.get('room'),
            faculty=CustomUser.objects.get(id=data.get('faculty'))
        )
        if conflict:
            raise drf_serializers.ValidationError(msg)
        serializer.save()

class RescheduleRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RescheduleRequestSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return RescheduleRequest.objects.all().order_by('-created_at')
        return RescheduleRequest.objects.filter(requested_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role != 'faculty':
            raise permissions.PermissionDenied("Only faculty can request reschedules.")
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='review')
    def review(self, request, pk=None):
        if request.user.role != 'admin':
            return Response({"error": "Only admins can review requests."}, status=403)

        reschedule = self.get_object()
        new_status = request.data.get('status')
        if new_status == 'approved':
            conflict, msg = check_schedule_conflict(
                day=reschedule.new_day,
                start=reschedule.new_start_time,
                end=reschedule.new_end_time,
                room=reschedule.new_room,
                faculty=reschedule.requested_by,
                exclude_id=reschedule.original_schedule.id
            )
            if conflict:
                return Response({"error": msg}, status=400)

            # Update the original ClassSchedule so the timetable reflects the change
            schedule = reschedule.original_schedule
            
            # Archive the old state if needed by creating a historical link
            # But here we just update the active slot
            schedule.day_of_week  = reschedule.new_day
            schedule.start_time   = reschedule.new_start_time
            schedule.end_time     = reschedule.new_end_time
            schedule.room         = reschedule.new_room
            schedule.reschedule_status = 'approved'
            schedule.save()

        elif new_status == 'rejected':
            schedule = reschedule.original_schedule
            schedule.reschedule_status = 'rejected'
            # Optionally set a note
            schedule.save()

        reschedule.status = new_status
        reschedule.save()
        return Response(RescheduleRequestSerializer(reschedule).data)

class LostFoundItemViewSet(viewsets.ModelViewSet):
    serializer_class = LostFoundItemSerializer
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = LostFoundItem.objects.all().order_by('-created_at')
        item_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        item_status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if item_type: queryset = queryset.filter(item_type=item_type)
        if category: queryset = queryset.filter(category=category)
        if item_status: queryset = queryset.filter(status=item_status)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        item = serializer.save(user=self.request.user, status='open')
        # Trigger matching logic
        find_matches(item)

    @action(detail=True, methods=['patch'])
    def claim(self, request, pk=None):
        item = self.get_object()
        item.status = 'claimed'
        item.save()
        return Response(LostFoundItemSerializer(item).data)

    @action(detail=True, methods=['post', 'patch'])
    def resolve(self, request, pk=None):
        item = self.get_object()
        if item.user != request.user and request.user.role != 'admin':
            return Response({'detail': 'Not authorized'}, status=http_status.HTTP_403_FORBIDDEN)
        if item.status == 'resolved':
            return Response({'detail': 'Already resolved'}, status=http_status.HTTP_400_BAD_REQUEST)
        item.status = 'resolved'
        item.resolved_at = timezone.now()
        item.resolved_by = request.user
        item.save()
        return Response(LostFoundItemSerializer(item).data)

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        item = get_object_or_404(LostFoundItem, pk=pk)
        # Only the reporter or admin can update status
        if item.user != request.user and request.user.role != 'admin':
            return Response({'error': 'Not authorized'}, status=http_status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        valid_statuses = ['open', 'matched', 'claimed', 'closed']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'}, status=http_status.HTTP_400_BAD_REQUEST)

        item.status = new_status
        item.save()
        return Response(LostFoundItemSerializer(item).data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=['patch'], url_path='mark-all-read')
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "all read"})

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Attendance.objects.filter(student=user).order_by('-date')
        return Attendance.objects.all().order_by('-date')

    @action(detail=False, methods=['post'], url_path='mark-bulk')
    def mark_bulk(self, request):
        if request.user.role != 'faculty':
            return Response({"error": "Only faculty can mark attendance."}, status=403)
        
        data = request.data # List of {student_id, status, schedule_id, date}
        results = []
        for item in data:
            attendance, created = Attendance.objects.update_or_create(
                student_id=item['student_id'],
                schedule_id=item['schedule_id'],
                date=item['date'],
                defaults={'status': item['status'], 'marked_by': request.user}
            )
            results.append(AttendanceSerializer(attendance).data)
        return Response(results)

    @action(detail=False, methods=['get'], url_path='my-summary')
    def my_summary(self, request):
        from django.db.models import Count, Q
        user = request.user
        summary = Attendance.objects.filter(student=user).values('schedule__subject').annotate(
            total_classes=Count('id'),
            attended=Count('id', filter=Q(status__in=['present', 'late']))
        )
        for s in summary:
            s['percentage'] = (s['attended'] / s['total_classes'] * 100) if s['total_classes'] > 0 else 0
        return Response(summary)

class StudentMarkViewSet(viewsets.ModelViewSet):
    serializer_class = StudentMarkSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return StudentMark.objects.filter(student=user).order_by('subject')
        return StudentMark.objects.all().order_by('student__username')

    @action(detail=False, methods=['post'], url_path='upload-bulk')
    def upload_bulk(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Only admins can upload marks."}, status=403)
        
        data = request.data # List of marks
        results = []
        for item in data:
            mark = StudentMark.objects.create(**item)
            results.append(StudentMarkSerializer(mark).data)
        return Response(results)

    @action(detail=False, methods=['get'], url_path='my-performance')
    def my_performance(self, request):
        user = request.user
        marks = StudentMark.objects.filter(student=user)
        # Group by subject
        performance = {}
        for m in marks:
            if m.subject not in performance:
                performance[m.subject] = {"subject": m.subject, "scores": {}, "total_obtained": 0, "total_max": 0}
            performance[m.subject]["scores"][m.exam_type] = m.obtained_marks
            performance[m.subject]["total_obtained"] += m.obtained_marks
            performance[m.subject]["total_max"] += m.max_marks
        
        for k in performance:
            performance[k]["percentage"] = (performance[k]["total_obtained"] / performance[k]["total_max"] * 100) if performance[k]["total_max"] > 0 else 0
            
        return Response(list(performance.values()))


class UserListView(generics.ListAPIView):
    """List users filtered by role/section — used by admin schedule & faculty attendance."""
    serializer_class = CustomUserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = CustomUser.objects.all().order_by('username')
        role = self.request.query_params.get('role')
        section = self.request.query_params.get('section')
        department = self.request.query_params.get('department')
        if role:
            queryset = queryset.filter(role=role)
        if section:
            queryset = queryset.filter(section=section)
        if department:
            queryset = queryset.filter(department=department)
        return queryset


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD over users + role/status/password/bulk actions."""
    serializer_class = AdminUserSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdmin)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        qs = CustomUser.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        department = self.request.query_params.get('department')
        section = self.request.query_params.get('section')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        if role:
            qs = qs.filter(role=role)
        if department:
            qs = qs.filter(department=department)
        if section:
            qs = qs.filter(section=section)
        if is_active in ('true', 'false'):
            qs = qs.filter(is_active=(is_active == 'true'))
        if search:
            qs = qs.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(roll_number__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        user = serializer.save()
        _log_audit(
            actor=self.request.user,
            action='user_created',
            target_user=user,
            details={'role': user.role, 'username': user.username},
            ip=_client_ip(self.request),
        )

    def perform_update(self, serializer):
        prev_role = serializer.instance.role
        prev_active = serializer.instance.is_active
        user = serializer.save()
        changes = {}
        if prev_role != user.role:
            changes['role'] = {'from': prev_role, 'to': user.role}
            _log_audit(actor=self.request.user, action='role_changed',
                       target_user=user, details=changes['role'], ip=_client_ip(self.request))
        if prev_active != user.is_active:
            _log_audit(
                actor=self.request.user,
                action='user_activated' if user.is_active else 'user_deactivated',
                target_user=user, ip=_client_ip(self.request),
            )
        if not changes:
            _log_audit(actor=self.request.user, action='user_updated',
                       target_user=user, ip=_client_ip(self.request))

    def perform_destroy(self, instance):
        if instance == self.request.user:
            raise drf_serializers.ValidationError("You cannot delete your own account.")
        username = instance.username
        _log_audit(actor=self.request.user, action='user_deleted',
                   details={'username': username, 'role': instance.role},
                   ip=_client_ip(self.request))
        instance.delete()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        _log_audit(actor=request.user, action='user_activated',
                   target_user=user, ip=_client_ip(request))
        return Response(AdminUserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': "You cannot deactivate your own account."},
                            status=http_status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save()
        # Invalidate outstanding tokens
        Token.objects.filter(user=user).delete()
        _log_audit(actor=request.user, action='user_deactivated',
                   target_user=user, ip=_client_ip(request))
        return Response(AdminUserSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='change-role')
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        valid = [c[0] for c in CustomUser.ROLE_CHOICES]
        if new_role not in valid:
            return Response({'detail': f"Invalid role. Must be one of: {', '.join(valid)}"},
                            status=http_status.HTTP_400_BAD_REQUEST)
        if user == request.user and new_role != 'admin':
            return Response({'detail': "You cannot change your own admin role."},
                            status=http_status.HTTP_400_BAD_REQUEST)
        prev = user.role
        user.role = new_role
        user.is_staff = (new_role == 'admin')
        user.save()
        _log_audit(actor=request.user, action='role_changed', target_user=user,
                   details={'from': prev, 'to': new_role}, ip=_client_ip(request))
        return Response(AdminUserSerializer(user).data)

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters.'},
                            status=http_status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        Token.objects.filter(user=user).delete()
        _log_audit(actor=request.user, action='password_reset',
                   target_user=user, ip=_client_ip(request))
        return Response({'detail': 'Password reset successfully.'})

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        rows = request.data if isinstance(request.data, list) else request.data.get('users', [])
        if not isinstance(rows, list) or not rows:
            return Response({'detail': 'Provide a non-empty list of users.'},
                            status=http_status.HTTP_400_BAD_REQUEST)

        created, errors = [], []
        for idx, row in enumerate(rows):
            try:
                serializer = AdminUserSerializer(data=row)
                serializer.is_valid(raise_exception=True)
                user = serializer.save()
                created.append(AdminUserSerializer(user).data)
            except Exception as exc:
                errors.append({'row': idx + 1, 'data': row, 'error': str(exc)})

        _log_audit(actor=request.user, action='bulk_import',
                   details={'created': len(created), 'failed': len(errors)},
                   ip=_client_ip(request))
        return Response({'created': created, 'errors': errors},
                        status=http_status.HTTP_207_MULTI_STATUS if errors else http_status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        qs = CustomUser.objects.all()
        return Response({
            'total': qs.count(),
            'students': qs.filter(role='student').count(),
            'faculty': qs.filter(role='faculty').count(),
            'admins': qs.filter(role='admin').count(),
            'active': qs.filter(is_active=True).count(),
            'inactive': qs.filter(is_active=False).count(),
        })


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = (permissions.IsAuthenticated, IsAdmin)

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor', 'target_user').all()
        action_filter = self.request.query_params.get('action')
        actor_id = self.request.query_params.get('actor')
        target_id = self.request.query_params.get('target_user')
        if action_filter:
            qs = qs.filter(action=action_filter)
        if actor_id:
            qs = qs.filter(actor_id=actor_id)
        if target_id:
            qs = qs.filter(target_user_id=target_id)
        return qs
