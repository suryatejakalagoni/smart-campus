import random
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import (
    ClassSchedule, Attendance, StudentMark, 
    LeaveRequest, QueueBooking, LostFoundItem, Notification
)
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with comprehensive demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        # 1. Create Users
        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={'role': 'admin', 'email': 'admin@campus.com'}
        )
        admin.set_password('admin123')
        admin.save()

        faculties = []
        depts = ['CSE', 'ECE', 'MECH']
        for i in range(1, 4):
            f, _ = User.objects.get_or_create(
                username=f'faculty{i}',
                defaults={'role': 'faculty', 'department': depts[i-1]}
            )
            f.set_password('faculty123')
            f.save()
            faculties.append(f)

        students = []
        for i in range(1, 11):
            roll = f'24B81A05{str(i).zfill(2)}'
            s, _ = User.objects.get_or_create(
                username=f'student{i}',
                defaults={
                    'role': 'student', 
                    'roll_number': roll, 
                    'department': 'CSE',
                    'section': 'CSE-A'
                }
            )
            s.set_password('student123')
            s.save()
            students.append(s)

        # 2. Class Schedules (CSE-A, Sem 4)
        subjects = ['DBMS', 'OS', 'CN', 'DAA', 'OOPS', 'Software Engineering', 'Probability', 'English']
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        schedules = []
        
        # Clear existing to avoid conflicts during re-seed
        ClassSchedule.objects.filter(section='CSE-A').delete()
        
        for i, sub in enumerate(subjects):
            day = days[i % len(days)]
            start_hour = 9 + (i % 3) # Spread across morning slots
            sched = ClassSchedule.objects.create(
                subject=sub,
                faculty=faculties[i % 2], # Assign to faculty1 or faculty2
                room=f'R-{100 + i}',
                day_of_week=day,
                start_time=f'{str(start_hour).zfill(2)}:00:00',
                end_time=f'{str(start_hour + 1).zfill(2)}:00:00',
                section='CSE-A',
                semester=4
            )
            schedules.append(sched)

        # 3. Attendance Records (Last 30 days)
        Attendance.objects.all().delete()
        today = timezone.now().date()
        for i in range(30):
            date = today - timedelta(days=i)
            # Find schedules for this day of week
            day_name = date.strftime('%A').lower()
            daily_scheds = [s for s in schedules if s.day_of_week == day_name]
            
            for sched in daily_scheds:
                for student in students:
                    # Random status weighted
                    status = random.choices(
                        ['present', 'absent', 'late'], 
                        weights=[80, 15, 5], 
                        k=1
                    )[0]
                    Attendance.objects.create(
                        student=student,
                        schedule=sched,
                        date=date,
                        status=status,
                        marked_by=sched.faculty
                    )

        # 4. Student Marks
        StudentMark.objects.all().delete()
        exams = [
            ('internal_1', 20), ('internal_2', 20), 
            ('internal_3', 20), ('assignment', 10)
        ]
        for student in students:
            for sub in subjects[:5]: # 5 subjects
                for ex_type, max_m in exams:
                    # Realistic scores: ~70% to 95%
                    obtained = random.randint(int(max_m * 0.7), max_m)
                    StudentMark.objects.create(
                        student=student,
                        subject=sub,
                        exam_type=ex_type,
                        max_marks=max_m,
                        obtained_marks=obtained,
                        semester=4
                    )

        # 5. Leave Requests
        LeaveRequest.objects.all().delete()
        for i in range(5):
             LeaveRequest.objects.create(
                 student=students[i],
                 leave_type=random.choice(['sick', 'personal', 'academic']),
                 start_date=today + timedelta(days=i),
                 end_date=today + timedelta(days=i+1),
                 reason=f"Demo leave request {i+1}",
                 status='pending'
             )
        for i in range(5, 8):
             LeaveRequest.objects.create(
                 student=students[i],
                 leave_type='personal',
                 start_date=today - timedelta(days=5),
                 end_date=today - timedelta(days=4),
                 reason="Approved demo leave",
                 status='approved',
                 admin_remarks="Approved by system"
             )
        for i in range(8, 10):
             LeaveRequest.objects.create(
                 student=students[i],
                 leave_type='personal',
                 start_date=today - timedelta(days=5),
                 end_date=today - timedelta(days=4),
                 reason="Rejected demo leave",
                 status='rejected',
                 admin_remarks="Not eligible"
             )

        # 6. Queue Bookings
        QueueBooking.objects.all().delete()
        purposes = ['certificate_collection', 'document_submission', 'fee_related']
        for i in range(8):
            day_offset = random.choice([0, 1])
            QueueBooking.objects.create(
                student=random.choice(students),
                purpose=random.choice(purposes),
                description=f"Demo booking {i+1}",
                preferred_date=today + timedelta(days=day_offset),
                time_slot="10:00-11:00",
                status=random.choice(['booked', 'in_progress', 'completed'])
            )

        # 7. Lost and Found (with matching logic trigger)
        LostFoundItem.objects.all().delete()
        Notification.objects.all().delete()
        
        # Specific match
        lost = LostFoundItem.objects.create(
            user=students[0],
            item_type='lost',
            title='Blue Samsung Earbuds',
            description='Lost near the library entrance. Brand new.',
            category='electronics',
            location_found_or_lost='Main Library',
            date_lost_or_found=today - timedelta(days=1),
            status='open'
        )
        
        found = LostFoundItem.objects.create(
            user=students[1],
            item_type='found',
            title='Blue Buds',
            description='Found a pair of blue samsung earbuds in the library.',
            category='electronics',
            location_found_or_lost='Library',
            date_lost_or_found=today,
            status='open'
        )

        self.stdout.write(self.style.SUCCESS(
            f'Created {User.objects.count()} users, '
            f'{ClassSchedule.objects.count()} schedules, '
            f'{Attendance.objects.count()} attendance records, '
            f'{StudentMark.objects.count()} marks, '
            f'{LeaveRequest.objects.count()} leave requests, '
            f'{QueueBooking.objects.count()} bookings, '
            f'{LostFoundItem.objects.count()} items.'
        ))
        self.stdout.write(self.style.SUCCESS("All demo data seeded successfully!"))
