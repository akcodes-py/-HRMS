from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Employee
from .serializers import EmployeeSerializer, EmployeeListSerializer
from accounts.permissions import IsAdminRole


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('user').all()
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'first_name', 'last_name', 'email',
        'employee_id', 'department', 'designation',
    ]
    ordering_fields = ['first_name', 'last_name', 'joining_date', 'department', 'salary', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        emp_status = self.request.query_params.get('status')
        if department:
            queryset = queryset.filter(department=department)
        if emp_status:
            queryset = queryset.filter(employment_status=emp_status)
        return queryset

    @action(detail=False, methods=['get'], url_path='stats', permission_classes=[IsAuthenticated, IsAdminRole])
    def stats(self, request):
        """Return aggregate employee statistics for the admin dashboard."""
        total = Employee.objects.count()
        active = Employee.objects.filter(employment_status='active').count()
        inactive = Employee.objects.filter(employment_status='inactive').count()
        terminated = Employee.objects.filter(employment_status='terminated').count()
        on_leave = Employee.objects.filter(employment_status='on_leave').count()

        # Department breakdown
        from django.db.models import Count
        dept_breakdown = (
            Employee.objects.values('department')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            'total': total,
            'active': active,
            'inactive': inactive,
            'terminated': terminated,
            'on_leave': on_leave,
            'department_breakdown': list(dept_breakdown),
        })

    @action(detail=False, methods=['get'], url_path='my-profile', permission_classes=[IsAuthenticated])
    def my_profile(self, request):
        """Return the employee profile linked to the current user."""
        try:
            employee = request.user.employee_profile
            serializer = EmployeeSerializer(employee, context={'request': request})
            return Response(serializer.data)
        except Employee.DoesNotExist:
            return Response({'error': 'No employee profile linked to your account.'}, status=404)
