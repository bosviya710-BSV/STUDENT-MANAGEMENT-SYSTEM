from django.core.management.base import BaseCommand
from students.models import Student

DEFAULT_STUDENTS = [
    {
        'student_id': 'STU1001',
        'name': 'Aarav Sharma',
        'email': 'aarav.sharma@college.edu',
        'phone': '9876543210',
        'department': 'Computer Science',
        'year': '3rd Year',
        'gender': 'Male'
    },
    {
        'student_id': 'STU1002',
        'name': 'Ananya Patel',
        'email': 'ananya.p@college.edu',
        'phone': '9812345678',
        'department': 'Information Technology',
        'year': '2nd Year',
        'gender': 'Female'
    },
    {
        'student_id': 'STU1003',
        'name': 'Rohan Verma',
        'email': 'rohan.v@college.edu',
        'phone': '9765432109',
        'department': 'Electronics & Communication',
        'year': '4th Year',
        'gender': 'Male'
    },
    {
        'student_id': 'STU1004',
        'name': 'Pooja Iyer',
        'email': 'pooja.iyer@college.edu',
        'phone': '9654321098',
        'department': 'Computer Science',
        'year': '1st Year',
        'gender': 'Female'
    },
    {
        'student_id': 'STU1005',
        'name': 'Vikram Singh',
        'email': 'vikram.singh@college.edu',
        'phone': '9543210987',
        'department': 'Mechanical Engineering',
        'year': '3rd Year',
        'gender': 'Male'
    },
    {
        'student_id': 'STU1006',
        'name': 'Neha Roy',
        'email': 'neha.roy@college.edu',
        'phone': '9432109876',
        'department': 'Civil Engineering',
        'year': '2nd Year',
        'gender': 'Female'
    }
]

class Command(BaseCommand):
    help = 'Seeds initial demo student records into SQLite database'

    def handle(self, *args, **options):
        created_count = 0
        for data in DEFAULT_STUDENTS:
            student, created = Student.objects.get_or_create(
                student_id=data['student_id'],
                defaults=data
            )
            if created:
                created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully seeded {created_count} demo students (Total: {Student.objects.count()}).')
        )
