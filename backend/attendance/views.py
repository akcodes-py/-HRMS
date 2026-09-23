from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Attendance
from .serializers import AttendanceSerializer
from .services import monthly_summary as build_monthly_summary
from .services import today_summary as build_today_summary
from employees.services import get_employee_for_user
from accounts.permissions import IsAdminRole


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related('employee').all()
    serializer_class = AttendanceSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee__first_name', 'employee__last_name',
        'employee__employee_id', 'status',
    ]
    ordering_fields = ['date', 'status', 'employee__first_name']
    ordering = ['-date']

    def get_permissions(self):
        # See employees.views for why admin actions are listed here rather
        # than on @action(permission_classes=...).
        if self.action in ['destroy', 'update', 'partial_update', 'today_summary']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        date = self.request.query_params.get('date')
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        att_status = self.request.query_params.get('status')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date:
            queryset = queryset.filter(date=date)
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        elif month:
            queryset = queryset.filter(date__month=month)
        if att_status:
            queryset = queryset.filter(status=att_status)

        # Employees can only see their own records
        if self.request.user.role != 'admin':
            emp = get_employee_for_user(self.request.user)
            if emp is None:
                return queryset.none()
            queryset = queryset.filter(employee=emp)

        return queryset

    @action(detail=False, methods=['get'], url_path='monthly-summary')
    def monthly_summary(self, request):
        """Return a breakdown of attendance statuses for a given month/year."""
        month = request.query_params.get('month', timezone.now().month)
        year = request.query_params.get('year', timezone.now().year)
        employee_id = request.query_params.get('employee')

        if employee_id:
            queryset_employee_id = employee_id
        elif request.user.role != 'admin':
            emp = get_employee_for_user(request.user)
            if emp is None:
                return Response(
                    {'error': 'Employee profile not linked.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            queryset_employee_id = emp.pk
        else:
            queryset_employee_id = None

        return Response(
            build_monthly_summary(
                month=month, year=year, employee_id=queryset_employee_id
            )
        )

    @action(detail=False, methods=['get'], url_path='today')
    def today_summary(self, request):
        """Admin dashboard: attendance summary for today."""
        return Response(build_today_summary())
