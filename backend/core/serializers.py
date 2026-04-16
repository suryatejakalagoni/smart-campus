from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, LeaveRequest, QueueBooking, ClassSchedule, RescheduleRequest, LostFoundItem, Notification, Attendance, StudentMark

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'roll_number', 'department', 'phone')
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
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'role', 'roll_number', 'department', 'phone', 'first_name', 'last_name')
        read_only_fields = ('id', 'role', 'username')

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
    class Meta:
        model = LostFoundItem
        fields = '__all__'
        read_only_fields = ('id', 'user', 'matched_with', 'created_at')

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
