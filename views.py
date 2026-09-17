from django.http import Http404
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Student
from .serializers import StudentSerializer

class StudentViewSet(viewsets.ModelViewSet):
    """
    Complete CRUD ViewSet for Student entity.
    Provides:
      - GET /api/students/ (List students with optional search & filters)
      - POST /api/students/ (Create a student)
      - GET /api/students/{id}/ (Retrieve student by student_id or pk)
      - PUT/PATCH /api/students/{id}/ (Update student)
      - DELETE /api/students/{id}/ (Delete student)
    """
    queryset = Student.objects.all().order_by('-created_at')
    serializer_class = StudentSerializer
    lookup_field = 'student_id'

    def get_queryset(self):
        queryset = Student.objects.all().order_by('-created_at')
        
        # Optional URL query parameters for search & filter
        search_query = self.request.query_params.get('search', '').strip()
        department = self.request.query_params.get('department', '').strip()
        year = self.request.query_params.get('year', '').strip()

        if search_query:
            queryset = queryset.filter(
                Q(student_id__icontains=search_query) |
                Q(name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(phone__icontains=search_query)
            )

        if department and department != 'ALL':
            queryset = queryset.filter(department__iexact=department)

        if year and year != 'ALL':
            queryset = queryset.filter(year__iexact=year)

        return queryset

    def get_object(self):
        """
        Support lookup by either student_id (e.g. STU1001) or primary key id (e.g. 1).
        """
        queryset = self.filter_queryset(Student.objects.all())
        lookup_val = self.kwargs.get(self.lookup_field)

        # 1. Try case-insensitive student_id match
        obj = queryset.filter(student_id__iexact=lookup_val).first()

        # 2. If not found and value is numeric, try primary key
        if not obj and lookup_val and lookup_val.isdigit():
            obj = queryset.filter(pk=int(lookup_val)).first()

        if not obj:
            raise Http404(f"Student with identifier '{lookup_val}' was not found.")

        self.check_object_permissions(self.request, obj)
        return obj

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        student_name = instance.name
        student_id = instance.student_id
        self.perform_destroy(instance)
        return Response(
            {
                "message": f"Student '{student_name}' ({student_id}) deleted successfully."
            },
            status=status.HTTP_200_OK  # 200 with clear message or 204
        )
