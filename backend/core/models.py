from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('faculty', 'Faculty'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    roll_number = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    section = models.CharField(max_length=10, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    address = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.role})"

class LeaveRequest(models.Model):
    LEAVE_TYPES = (
        ('sick', 'Sick'),
        ('personal', 'Personal'),
        ('academic', 'Academic'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'student'}, related_name='leaves')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_remarks = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.username} - {self.leave_type} ({self.status})"

class QueueBooking(models.Model):
    PURPOSE_CHOICES = (
        ('certificate_collection', 'Certificate Collection'),
        ('document_submission', 'Document Submission'),
        ('fee_related', 'Fee Related'),
        ('transcript_request', 'Transcript Request'),
        ('other', 'Other'),
    )
    SLOT_CHOICES = (
        ('09:00-10:00', '09:00-10:00'),
        ('10:00-11:00', '10:00-11:00'),
        ('11:00-12:00', '11:00-12:00'),
        ('12:00-13:00', '12:00-13:00'),
        ('14:00-15:00', '14:00-15:00'),
        ('15:00-16:00', '15:00-16:00'),
    )
    STATUS_CHOICES = (
        ('booked', 'Booked'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='queue_bookings')
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES)
    description = models.TextField()
    preferred_date = models.DateField()
    time_slot = models.CharField(max_length=20, choices=SLOT_CHOICES)
    token_number = models.CharField(max_length=20, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='booked')
    otp = models.CharField(max_length=6, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.otp:
            import random
            self.otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        if not self.token_number:
            date_str = self.preferred_date.strftime('%Y%m%d')
            count = QueueBooking.objects.filter(preferred_date=self.preferred_date).count() + 1
            self.token_number = f"QT-{date_str}-{count:03d}"
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.token_number} - {self.student.username} ({self.status})"

class ClassSchedule(models.Model):
    DAY_CHOICES = (
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
    )
    subject = models.CharField(max_length=100)
    faculty = models.ForeignKey(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'faculty'}, related_name='classes')
    room = models.CharField(max_length=20)
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    section = models.CharField(max_length=10)
    semester = models.IntegerField()
    is_active = models.BooleanField(default=True)
    
    # Reschedule tracking
    rescheduled_from = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='rescheduled_to')
    reschedule_status = models.CharField(
        max_length=20,
        choices=[('none','None'),('pending','Pending'),('approved','Approved'),('rejected','Rejected')],
        default='none'
    )
    reschedule_note = models.TextField(blank=True)

    def __str__(self):
        return f"{self.subject} - {self.section} ({self.day_of_week})"

class RescheduleRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    original_schedule = models.ForeignKey(ClassSchedule, on_delete=models.CASCADE, related_name='reschedules')
    requested_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reschedule_requests')
    new_day = models.CharField(max_length=10, choices=ClassSchedule.DAY_CHOICES)
    new_start_time = models.TimeField()
    new_end_time = models.TimeField()
    new_room = models.CharField(max_length=20)
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Reschedule: {self.original_schedule.subject} to {self.new_date} ({self.status})"

class LostFoundItem(models.Model):
    TYPE_CHOICES = (('lost', 'Lost'), ('found', 'Found'))
    CATEGORY_CHOICES = (
        ('electronics', 'Electronics'),
        ('documents', 'Documents'),
        ('clothing', 'Clothing'),
        ('accessories', 'Accessories'),
        ('books', 'Books'),
        ('other', 'Other'),
    )
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('matched', 'Matched'),
        ('claimed', 'Claimed'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='lost_found_items')
    item_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    location_found_or_lost = models.CharField(max_length=200)
    date_lost_or_found = models.DateField()
    image = models.ImageField(upload_to='lost_found/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    matched_with = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_items')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.item_type.capitalize()}: {self.title}"

class Notification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:30]}..."

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
    )
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendance')
    schedule = models.ForeignKey(ClassSchedule, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='marked_attendance')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'schedule', 'date')

    def __str__(self):
        return f"{self.student.username} - {self.date} ({self.status})"

class AuditLog(models.Model):
    ACTION_CHOICES = (
        ('user_created', 'User Created'),
        ('user_updated', 'User Updated'),
        ('user_deleted', 'User Deleted'),
        ('user_activated', 'User Activated'),
        ('user_deactivated', 'User Deactivated'),
        ('role_changed', 'Role Changed'),
        ('password_reset', 'Password Reset'),
        ('bulk_import', 'Bulk Import'),
    )
    actor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='audit_actions')
    target_user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_targets')
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        actor = self.actor.username if self.actor else 'system'
        target = self.target_user.username if self.target_user else '-'
        return f"{actor} {self.action} {target}"


class StudentMark(models.Model):
    EXAM_CHOICES = (
        ('internal_1', 'Internal 1'),
        ('internal_2', 'Internal 2'),
        ('internal_3', 'Internal 3'),
        ('assignment', 'Assignment'),
        ('external', 'External'),
    )
    student = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='marks')
    subject = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=EXAM_CHOICES)
    max_marks = models.IntegerField()
    obtained_marks = models.IntegerField()
    semester = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.username} - {self.subject} ({self.exam_type})"
