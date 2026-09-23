from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Employee
from .serializers import EmployeeSerializer, EmployeeListSerializer
from .services import employee_dashboard_stats, get_employee_for_user
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
        # Single source of truth for role checks. Do not add
        # permission_classes to @action decorators — get_permissions()
        # overrides them, so listing admin actions here keeps behavior
        # explicit and prevents the two from drifting apart.
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'stats']:
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

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """Return aggregate employee statistics for the admin dashboard."""
        return Response(employee_dashboard_stats())

    @action(detail=False, methods=['get'], url_path='my-profile')
    def my_profile(self, request):
        """Return the employee profile linked to the current user."""
        employee = get_employee_for_user(request.user)
        if employee is None:
            return Response(
                {'error': 'No employee profile linked to your account.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = EmployeeSerializer(employee, context={'request': request})
        return Response(serializer.data)
