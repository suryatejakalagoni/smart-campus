import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from core.models import LeaveRequest, QueueBooking, ClassSchedule, LostFoundItem, Notification, Attendance, StudentMark

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with realistic demo data across all modules'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip the confirmation prompt',
        )

    def handle(self, *args, **options):
        force = options.get('force')

        if User.objects.count() > 3 and not force:
            self.stdout.write(self.style.WARNING("Warning: Database might already have seed data."))
            confirm = input("Type 'yes' to continue and OVERWRITE demo data: ")
            if confirm.lower() != 'yes':
                self.stdout.write("Seed operation cancelled.")
                return

        self.stdout.write("Starting database seed...")

        try:
            with transaction.atomic():
                self._seed_users()
                self._seed_leaves()
                self._seed_queue()
                self._seed_schedules()
                self._seed_lost_found()
                self._seed_attendance_marks()

            self.stdout.write(self.style.SUCCESS("""
* Users created: 8 additional
* Leave applications: 8
* Queue bookings: 6
* Class schedule entries: 20
* Lost & Found items: 10 (2 matched)
* Attendance records: 450+
* Marks records: 30
> Demo seed complete. Login at http://localhost:5173
"""))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding database: {e}"))
            raise e

    def _seed_users(self):
        # We assume admin, student1, faculty1 already exist from quick seed
        self.admin = User.objects.filter(username='admin').first()
        self.student1 = User.objects.filter(username='student1').first()
        self.faculty1 = User.objects.filter(username='faculty1').first()

        # Just to ensure they exist
        if not self.admin:
            self.admin = User.objects.create_superuser('admin', 'admin@smartcampus.com', 'admin123')
            self.admin.role = 'admin'
            self.admin.save()
            
        if not self.student1:
            self.student1 = User.objects.create_user('student1', 'student1@smartcampus.com', 'student123')
            self.student1.role = 'student'
            self.student1.roll_number = '24B81A0501'
            self.student1.department = 'CSE'
            self.student1.save()
            
        if not self.faculty1:
            self.faculty1 = User.objects.create_user('faculty1', 'faculty1@smartcampus.com', 'faculty123')
            self.faculty1.role = 'faculty'
            self.faculty1.department = 'CSE'
            self.faculty1.save()

        # Students
        students_data = [
            {'username': 'student2', 'password': 'student123', 'first_name': 'Priya', 'last_name': 'Sharma', 'roll': '24B81A0502', 'dept': 'CSE', 'email': 'priya@campus.edu'},
            {'username': 'student3', 'password': 'student123', 'first_name': 'Rahul', 'last_name': 'Verma', 'roll': '24B81A0503', 'dept': 'ECE', 'email': 'rahul@campus.edu'},
            {'username': 'student4', 'password': 'student123', 'first_name': 'Anjali', 'last_name': 'Reddy', 'roll': '24B81A0504', 'dept': 'MECH', 'email': 'anjali@campus.edu'},
            {'username': 'student5', 'password': 'student123', 'first_name': 'Karthik', 'last_name': 'Nair', 'roll': '24B81A0505', 'dept': 'CSE', 'email': 'karthik@campus.edu'},
            {'username': 'student6', 'password': 'student123', 'first_name': 'Divya', 'last_name': 'Patel', 'roll': '24B81A0506', 'dept': 'IT', 'email': 'divya@campus.edu'},
        ]
        self.students = {'student1': self.student1}
        for s in students_data:
            user, created = User.objects.get_or_create(username=s['username'], defaults={'email': s['email']})
            user.set_password(s['password'])
            user.first_name = s['first_name']
            user.last_name = s['last_name']
            user.role = 'student'
            user.roll_number = s['roll']
            user.department = s['dept']
            user.save()
            self.students[s['username']] = user

        # Faculty
        faculty_data = [
            {'username': 'faculty2', 'password': 'faculty123', 'first_name': 'Dr.', 'last_name': 'Ramesh Kumar', 'dept': 'CSE', 'email': 'ramesh@campus.edu'},
            {'username': 'faculty3', 'password': 'faculty123', 'first_name': 'Prof.', 'last_name': 'Sunita Rao', 'dept': 'ECE', 'email': 'sunita@campus.edu'},
            {'username': 'faculty4', 'password': 'faculty123', 'first_name': 'Dr.', 'last_name': 'Vijay Menon', 'dept': 'MECH', 'email': 'vijay@campus.edu'},
        ]
        self.faculties = {'faculty1': self.faculty1}
        for f in faculty_data:
            user, created = User.objects.get_or_create(username=f['username'], defaults={'email': f['email']})
            user.set_password(f['password'])
            user.first_name = f['first_name']
            user.last_name = f['last_name']
            user.role = 'faculty'
            user.department = f['dept']
            user.save()
            self.faculties[f['username']] = user

    def _seed_leaves(self):
        LeaveRequest.objects.all().delete()
        today = timezone.now().date()
        
        leaves_data = [
            {'student': self.students['student1'], 'type': 'sick', 'start': today+timedelta(days=2), 'end': today+timedelta(days=4), 'reason': 'Viral fever, doctor advised 3 days rest. Medical certificate attached.', 'status': 'pending', 'admin': None, 'remark': ''},
            {'student': self.students['student2'], 'type': 'personal', 'start': today-timedelta(days=5), 'end': today-timedelta(days=3), 'reason': 'Family function in hometown, need to travel to Vijayawada.', 'status': 'approved', 'admin': self.admin, 'remark': 'Approved'},
            {'student': self.students['student3'], 'type': 'sick', 'start': today-timedelta(days=10), 'end': today-timedelta(days=8), 'reason': 'Appendix surgery recovery period.', 'status': 'approved', 'admin': self.admin, 'remark': 'Get well soon'},
            {'student': self.students['student4'], 'type': 'personal', 'start': today+timedelta(days=1), 'end': today+timedelta(days=1), 'reason': 'Personal work in city.', 'status': 'rejected', 'admin': self.admin, 'remark': 'Insufficient notice period'},
            {'student': self.students['student5'], 'type': 'other', 'start': today+timedelta(days=7), 'end': today+timedelta(days=9), 'reason': 'Selected for inter-college cricket tournament at JNTUH.', 'status': 'pending', 'admin': None, 'remark': ''},
            {'student': self.students['student1'], 'type': 'sick', 'start': today-timedelta(days=20), 'end': today-timedelta(days=18), 'reason': 'Dental procedure follow-up.', 'status': 'approved', 'admin': self.admin, 'remark': 'Approved'},
            {'student': self.students['student6'], 'type': 'academic', 'start': today+timedelta(days=3), 'end': today+timedelta(days=3), 'reason': 'Workshop on Machine Learning at IIT Hyderabad.', 'status': 'pending', 'admin': None, 'remark': ''},
            {'student': self.students['student2'], 'type': 'personal', 'start': today-timedelta(days=2), 'end': today-timedelta(days=2), 'reason': 'Personal errand.', 'status': 'rejected', 'admin': self.admin, 'remark': 'Leave quota exhausted for this semester'},
        ]

        for ld in leaves_data:
            LeaveRequest.objects.create(
                student=ld['student'],
                leave_type=ld['type'],
                start_date=ld['start'],
                end_date=ld['end'],
                reason=ld['reason'],
                status=ld['status'],
                admin_remarks=ld['remark'],
                reviewed_by=ld['admin']
            )

    def _seed_queue(self):
        QueueBooking.objects.all().delete()
        today = timezone.now().date()
        tomorrow = today + timedelta(days=1)
        day_after = today + timedelta(days=2)

        is_weekend = today.weekday() >= 5
        wk_today = today if not is_weekend else today + timedelta(days=7 - today.weekday())

        bookings_data = [
            {'student': self.students['student1'], 'date': tomorrow, 'slot': '09:00-10:00', 'purpose': 'certificate_collection', 'desc': 'Bonafide Certificate for bank loan', 'token': 'TKN-001', 'otp': '847291', 'status': 'booked'},
            {'student': self.students['student2'], 'date': tomorrow, 'slot': '09:00-10:00', 'purpose': 'transcript_request', 'desc': 'Transcript request for higher studies abroad', 'token': 'TKN-002', 'otp': '563847', 'status': 'booked'},
            {'student': self.students['student3'], 'date': wk_today, 'slot': '14:00-15:00', 'purpose': 'fee_related', 'desc': 'Fee payment receipt duplicate', 'token': 'TKN-003', 'otp': '192847', 'status': 'completed'},
            {'student': self.students['student4'], 'date': wk_today, 'slot': '14:00-15:00', 'purpose': 'document_submission', 'desc': 'Migration certificate application', 'token': 'TKN-004', 'otp': '374856', 'status': 'completed'},
            {'student': self.students['student5'], 'date': day_after, 'slot': '10:00-11:00', 'purpose': 'certificate_collection', 'desc': 'Character certificate for job application', 'token': 'TKN-005', 'otp': '627384', 'status': 'booked'},
            {'student': self.students['student6'], 'date': tomorrow, 'slot': '09:00-10:00', 'purpose': 'other', 'desc': 'Name correction in hall ticket', 'token': 'TKN-006', 'otp': '918273', 'status': 'booked'},
        ]

        for bd in bookings_data:
            qb = QueueBooking.objects.create(
                student=bd['student'], 
                preferred_date=bd['date'], 
                time_slot=bd['slot'], 
                purpose=bd['purpose'], 
                description=bd['desc'],
                status=bd['status']
            )
            # Override token and otp generated in save()
            QueueBooking.objects.filter(pk=qb.pk).update(token_number=bd['token'], otp=bd['otp'])

    def _seed_schedules(self):
        ClassSchedule.objects.all().delete()
        
        schedule_data = [
            ('CS501: Data Structures & Algorithms', self.faculties['faculty1'], 'CR-101', 'monday', '09:00', '10:00'),
            ('CS502: Database Management Systems', self.faculties['faculty2'], 'CR-101', 'monday', '10:00', '11:00'),
            ('CS503: Operating Systems', self.faculties['faculty1'], 'CR-102', 'monday', '11:00', '12:00'),
            ('CS-LAB1: DBMS Lab', self.faculties['faculty2'], 'LAB-201', 'monday', '14:00', '17:00'),

            ('CS504: Computer Networks', self.faculties['faculty3'], 'CR-101', 'tuesday', '09:00', '10:00'),
            ('CS505: Software Engineering', self.faculties['faculty2'], 'CR-102', 'tuesday', '10:00', '11:00'),
            ('CS501: Data Structures & Algorithms', self.faculties['faculty1'], 'CR-101', 'tuesday', '11:00', '12:00'),
            ('CS-LAB2: Networks Lab', self.faculties['faculty3'], 'LAB-202', 'tuesday', '14:00', '17:00'),

            ('CS502: Database Management Systems', self.faculties['faculty2'], 'CR-102', 'wednesday', '09:00', '10:00'),
            ('CS503: Operating Systems', self.faculties['faculty1'], 'CR-101', 'wednesday', '10:00', '11:00'),
            ('CS504: Computer Networks', self.faculties['faculty3'], 'CR-103', 'wednesday', '11:00', '12:00'),

            ('CS505: Software Engineering', self.faculties['faculty2'], 'CR-101', 'thursday', '09:00', '10:00'),
            ('CS501: Data Structures & Algorithms', self.faculties['faculty1'], 'CR-102', 'thursday', '10:00', '11:00'),
            ('CS502: Database Management Systems', self.faculties['faculty2'], 'CR-101', 'thursday', '11:00', '12:00'),
            ('CS-LAB1: DBMS Lab', self.faculties['faculty2'], 'LAB-201', 'thursday', '14:00', '17:00'),

            ('CS503: Operating Systems', self.faculties['faculty1'], 'CR-103', 'friday', '09:00', '10:00'),
            ('CS504: Computer Networks', self.faculties['faculty3'], 'CR-101', 'friday', '10:00', '11:00'),
            ('CS505: Software Engineering', self.faculties['faculty2'], 'CR-102', 'friday', '11:00', '12:00'),
        ]

        self.cs_map = {}
        for (subj, fac, rm, day, start, end) in schedule_data:
            cs = ClassSchedule.objects.create(
                subject=subj, faculty=fac, room=rm, day_of_week=day,
                start_time=start + ":00", end_time=end + ":00",
                section="A", semester=5
            )
            subj_code = subj.split(':')[0]
            if subj_code not in self.cs_map:
                self.cs_map[subj_code] = []
            self.cs_map[subj_code].append(cs)

    def _seed_lost_found(self):
        LostFoundItem.objects.all().delete()
        Notification.objects.all().delete()
        today = timezone.now().date()

        items = [
            {'user': self.students['student1'], 'type': 'lost', 'title': 'Black HP laptop bag', 'desc': 'Black HP laptop backpack with red zipper, contains laptop charger and notebook. Lost near Library on Monday.', 'loc': 'Library Block', 'date': today-timedelta(days=3), 'cat': 'electronics', 'status': 'open'},
            {'user': self.students['student3'], 'type': 'lost', 'title': 'Student ID Card', 'desc': 'CVR College ID card for Rahul Verma, Roll 24B81A0503. Lost somewhere between canteen and Block-B.', 'loc': 'Block-B Corridor', 'date': today-timedelta(days=5), 'cat': 'documents', 'status': 'matched'},
            {'user': self.students['student5'], 'type': 'lost', 'title': 'Blue Casio watch', 'desc': 'Blue dial Casio digital watch with black strap. Sentimental value. Lost during sports practice.', 'loc': 'Sports Ground', 'date': today-timedelta(days=7), 'cat': 'accessories', 'status': 'open'},
            {'user': self.students['student4'], 'type': 'lost', 'title': 'Mechanical Engineering drawing set', 'desc': 'Staedtler geometry set in orange case. Has my name written inside. Lost in Drawing Hall.', 'loc': 'Drawing Hall', 'date': today-timedelta(days=2), 'cat': 'other', 'status': 'open'},
            
            {'user': self.students['student2'], 'type': 'found', 'title': 'Student ID Card', 'desc': 'Found an ID card near Block-B corridor on the floor. Name: Rahul Verma.', 'loc': 'Block-B', 'date': today-timedelta(days=4), 'cat': 'documents', 'status': 'matched'},
            {'user': self.students['student6'], 'type': 'found', 'title': 'Black backpack', 'desc': 'Found a black backpack near library reading room. Contains laptop charger and some notebooks.', 'loc': 'Library', 'date': today-timedelta(days=2), 'cat': 'other', 'status': 'open'},
            {'user': self.faculties['faculty1'], 'type': 'found', 'title': 'Casio watch, blue dial', 'desc': 'Found a blue Casio watch near the basketball court. Black rubber strap.', 'loc': 'Basketball Court', 'date': today-timedelta(days=6), 'cat': 'accessories', 'status': 'open'},
            {'user': self.students['student1'], 'type': 'found', 'title': 'Drawing instruments set', 'desc': 'Found an orange Staedtler geometry set in the seminar hall. Has a name tag inside.', 'loc': 'Seminar Hall', 'date': today-timedelta(days=1), 'cat': 'other', 'status': 'open'},
            {'user': self.faculties['faculty2'], 'type': 'found', 'title': 'Spectacles', 'desc': 'Found black-framed spectacles in CR-101 after evening class.', 'loc': 'CR-101', 'date': today-timedelta(days=1), 'cat': 'accessories', 'status': 'open'},
            {'user': self.students['student3'], 'type': 'found', 'title': 'Water bottle, blue Milton', 'desc': 'Found a Milton steel water bottle near the canteen entrance.', 'loc': 'Canteen', 'date': today-timedelta(days=3), 'cat': 'other', 'status': 'open'}
        ]

        obj_list = []
        for i in items:
            obj_list.append(LostFoundItem.objects.create(
                user=i['user'], item_type=i['type'], title=i['title'], description=i['desc'],
                category=i['cat'], location_found_or_lost=i['loc'], date_lost_or_found=i['date'],
                status=i['status']
            ))

        # Match Item 2 and Item 5 (0-based: index 1 and 4)
        obj_list[1].matched_with = obj_list[4]
        obj_list[1].save()

        obj_list[4].matched_with = obj_list[1]
        obj_list[4].save()

        # Notification
        Notification.objects.create(
            user=self.students['student3'],
            message="Your lost item 'Student ID Card' has been found! Contact student2 to collect it."
        )

    def _seed_attendance_marks(self):
        Attendance.objects.all().delete()
        StudentMark.objects.all().delete()

        today = timezone.now().date()
        working_days = []
        d = today
        while len(working_days) < 45:
            d -= timedelta(days=1)
            if d.weekday() < 5:  # Mon-Fri
                working_days.append(d)
        
        att_cfg_1 = {'CS501': 38, 'CS502': 40, 'CS503': 32, 'CS504': 43, 'CS505': 36}
        att_cfg_2 = {'CS501': 42, 'CS502': 44, 'CS503': 41, 'CS504': 39, 'CS505': 43}
        
        for subj_code, schedules_for_subj in self.cs_map.items():
            if not schedules_for_subj: continue
            for st, cfg in [(self.students['student1'], att_cfg_1), (self.students['student2'], att_cfg_2)]:
                att_count = cfg.get(subj_code, 0)
                status_list = ['present'] * att_count + ['absent'] * (45 - att_count)
                random.shuffle(status_list)

                for i, status in enumerate(status_list):
                    w_day = working_days[i]
                    schedule = random.choice(schedules_for_subj)
                    Attendance.objects.update_or_create(
                        student=st, schedule=schedule, date=w_day,
                        defaults={'status': status, 'marked_by': schedule.faculty}
                    )

        marks_1 = {
            'CS501: Data Structures & Algorithms': [24, 27, 26],
            'CS502: Database Management Systems': [28, 25, 29],
            'CS503: Operating Systems': [19, 22, 21],
            'CS504: Computer Networks': [29, 30, 28],
            'CS505: Software Engineering': [23, 26, 25]
        }
        marks_2 = {
            'CS501: Data Structures & Algorithms': [28, 29, 30],
            'CS502: Database Management Systems': [29, 30, 30],
            'CS503: Operating Systems': [25, 27, 28],
            'CS504: Computer Networks': [26, 25, 27],
            'CS505: Software Engineering': [28, 29, 29]
        }

        for st, m_data in [(self.students['student1'], marks_1), (self.students['student2'], marks_2)]:
            for subj, m_list in m_data.items():
                for idx, mk in enumerate(m_list):
                    StudentMark.objects.create(
                        student=st, subject=subj, exam_type=f'internal_{idx+1}', 
                        max_marks=30, obtained_marks=mk, semester=5
                    )
