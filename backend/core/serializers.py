from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser, LeaveRequest, QueueBooking, ClassSchedule, RescheduleRequest, LostFoundItem, Notification, Attendance, StudentMark, AuditLog

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'roll_number', 'department', 'phone', 'avatar', 'section')
        read_only_fields = ('id',)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password', 'confirm_password', 'role', 'roll_number', 'department', 'phone')

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = CustomUser.objects.create_user(**validated_data)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Incorrect Credentials")

class UserProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'role',
            'first_name', 'last_name',
            'roll_number', 'department', 'phone', 'section',
            'avatar', 'bio', 'date_of_birth', 'address',
            'date_joined', 'last_login', 'updated_at',
        )
        read_only_fields = ('id', 'role', 'username', 'date_joined', 'last_login', 'updated_at')


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': "New passwords do not match."})
        user = self.context['request'].user
        if not user.check_password(data['current_password']):
            raise serializers.ValidationError({'current_password': "Current password is incorrect."})
        if data['current_password'] == data['new_password']:
            raise serializers.ValidationError({'new_password': "New password must differ from current password."})
        return data

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

class LeaveRequestSerializer(serializers.ModelSerializer):
    student = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('id', 'student', 'status', 'admin_remarks', 'reviewed_by', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['student'] = self.context['request'].user
        return super().create(validated_data)

class LeaveReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ('status', 'admin_remarks')

    def update(self, instance, validated_data):
        instance.status = validated_data.get('status', instance.status)
        instance.admin_remarks = validated_data.get('admin_remarks', instance.admin_remarks)
        instance.reviewed_by = self.context['request'].user
        instance.save()
        return instance

class QueueBookingSerializer(serializers.ModelSerializer):
    student = CustomUserSerializer(read_only=True)
    class Meta:
        model = QueueBooking
        fields = '__all__'
        read_only_fields = ('id', 'student', 'token_number', 'otp', 'status', 'created_at')

class ClassScheduleSerializer(serializers.ModelSerializer):
    faculty_details = CustomUserSerializer(source='faculty', read_only=True)
    pending_reschedule = serializers.SerializerMethodField()

    def get_pending_reschedule(self, obj):
        return obj.reschedules.filter(status='pending').exists()

    class Meta:
        model = ClassSchedule
        fields = '__all__'

class RescheduleRequestSerializer(serializers.ModelSerializer):
    requested_by = CustomUserSerializer(read_only=True)
    original_schedule_details = ClassScheduleSerializer(source='original_schedule', read_only=True)
    class Meta:
        model = RescheduleRequest
        fields = '__all__'
        read_only_fields = ('id', 'requested_by', 'status', 'created_at')

class LostFoundItemSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = LostFoundItem
        fields = '__all__'
        read_only_fields = ('id', 'user', 'status', 'matched_with', 'created_at')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at')

class AttendanceSerializer(serializers.ModelSerializer):
    student_details = CustomUserSerializer(source='student', read_only=True)
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('id', 'marked_by', 'created_at')

class StudentMarkSerializer(serializers.ModelSerializer):
    student_details = CustomUserSerializer(source='student', read_only=True)
    class Meta:
        model = StudentMark
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'username', 'email', 'password',
            'first_name', 'last_name', 'full_name',
            'role', 'roll_number', 'department', 'phone', 'section',
            'avatar', 'bio', 'date_of_birth', 'address',
            'is_active', 'is_staff', 'is_superuser',
            'date_joined', 'last_login', 'updated_at',
        )
        read_only_fields = ('id', 'is_staff', 'is_superuser', 'date_joined', 'last_login', 'updated_at', 'full_name')

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def validate_password(self, value):
        if value:
            validate_password(value)
        return value

    def validate(self, data):
        if self.instance is None and not data.get('password'):
            raise serializers.ValidationError({'password': 'Password is required when creating a user.'})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser(**validated_data)
        if password:
            user.set_password(password)
        if user.role == 'admin':
            user.is_staff = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        role_changed = 'role' in validated_data and validated_data['role'] != instance.role
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if role_changed:
            instance.is_staff = (instance.role == 'admin')
        instance.save()
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default=None)
    target_username = serializers.CharField(source='target_user.username', read_only=True, default=None)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ('id', 'actor', 'actor_username', 'target_user', 'target_username',
                  'action', 'action_display', 'details', 'ip_address', 'created_at')
        read_only_fields = fields
