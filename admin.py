from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'email', 'phone', 'department', 'year', 'gender', 'created_at')
    list_filter = ('department', 'year', 'gender')
    search_fields = ('student_id', 'name', 'email', 'phone')
    ordering = ('-created_at',)
