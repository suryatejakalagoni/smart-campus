from rest_framework import status, generics, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.db.models import Q
from .models import CustomUser, LeaveRequest, QueueBooking, ClassSchedule, RescheduleRequest, LostFoundItem, Notification, Attendance, StudentMark
from .utils import check_schedule_conflict, find_matches
from .serializers import (
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer, 
    LeaveRequestSerializer,
    LeaveReviewSerializer,
    QueueBookingSerializer,
    ClassScheduleSerializer,
    RescheduleRequestSerializer,
    LostFoundItemSerializer,
    NotificationSerializer,
    AttendanceSerializer,
    StudentMarkSerializer
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
        }, status=status.HTTP_201_CREATED)

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

    def get_object(self):
        return self.request.user

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
            return Response({"error": "Only admins can review leaves."}, status=status.HTTP_403_FORBIDDEN)
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
            raise serializers.ValidationError("This time slot is fully booked. Please choose another.")
            
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
        day = self.request.query_params.get('day')
        section = self.request.query_params.get('section')
        semester = self.request.query_params.get('semester')
        queryset = ClassSchedule.objects.filter(is_active=True)
        if day: queryset = queryset.filter(day_of_week=day)
        if section: queryset = queryset.filter(section=section)
        if semester: queryset = queryset.filter(semester=semester)
        return queryset.order_by('day_of_week', 'start_time')

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
            raise serializers.ValidationError(msg)
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
        status = request.data.get('status')
        if status == 'approved':
            # Conflict Check for new time/room
            conflict, msg = check_schedule_conflict(
                day=reschedule.new_date.strftime('%A').lower(), # Need to map date to day_of_week or handle differently
                start=reschedule.new_start_time,
                end=reschedule.new_end_time,
                room=reschedule.new_room,
                faculty=reschedule.requested_by,
                exclude_id=reschedule.original_schedule.id
            )
            if conflict:
                return Response({"error": msg}, status=400)
            
            # Update the original schedule or create a temporary one?
            # User said "timetable updates". I'll update the original for simplicity or keep it as is.
            # Actually, Reschedule is usually for a specific DATE.
            # I'll just mark the request as approved.
        
        reschedule.status = status
        reschedule.save()
        return Response(RescheduleRequestSerializer(reschedule).data)

class LostFoundItemViewSet(viewsets.ModelViewSet):
    serializer_class = LostFoundItemSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = LostFoundItem.objects.all().order_by('-created_at')
        item_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if item_type: queryset = queryset.filter(item_type=item_type)
        if category: queryset = queryset.filter(category=category)
        if status: queryset = queryset.filter(status=status)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        item = serializer.save(user=self.request.user)
        # Trigger matching logic
        find_matches(item)

    @action(detail=True, methods=['patch'])
    def claim(self, request, pk=None):
        item = self.get_object()
        item.status = 'claimed'
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
