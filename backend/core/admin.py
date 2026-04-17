from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, LeaveRequest, QueueBooking, ClassSchedule,
    RescheduleRequest, LostFoundItem, Notification, Attendance, StudentMark
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'department', 'section', 'is_active')
    list_filter = ('role', 'department', 'is_active')
    search_fields = ('username', 'email', 'roll_number')
    fieldsets = UserAdmin.fieldsets + (
        ('Campus Info', {'fields': ('role', 'roll_number', 'department', 'phone', 'section')}),
    )


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('student', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'leave_type')


@admin.register(QueueBooking)
class QueueBookingAdmin(admin.ModelAdmin):
    list_display = ('token_number', 'student', 'purpose', 'preferred_date', 'time_slot', 'status')
    list_filter = ('status', 'preferred_date')


@admin.register(ClassSchedule)
class ClassScheduleAdmin(admin.ModelAdmin):
    list_display = ('subject', 'faculty', 'room', 'day_of_week', 'start_time', 'end_time', 'section', 'semester', 'reschedule_status')
    list_filter = ('day_of_week', 'section', 'semester', 'reschedule_status')


@admin.register(RescheduleRequest)
class RescheduleRequestAdmin(admin.ModelAdmin):
    list_display = ('original_schedule', 'requested_by', 'new_day', 'new_start_time', 'status')
    list_filter = ('status', 'new_day')


@admin.register(LostFoundItem)
class LostFoundItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'item_type', 'category', 'status', 'user')
    list_filter = ('item_type', 'category', 'status')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'created_at')
    list_filter = ('is_read',)


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'schedule', 'date', 'status', 'marked_by')
    list_filter = ('status', 'date')


@admin.register(StudentMark)
class StudentMarkAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'exam_type', 'obtained_marks', 'max_marks', 'semester')
    list_filter = ('exam_type', 'semester')
