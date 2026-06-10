from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Attendance
from .serializers import AttendanceSerializer
from employees.models import Employee
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
        if self.action in ['destroy', 'update', 'partial_update']:
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
            try:
                emp = self.request.user.employee_profile
                queryset = queryset.filter(employee=emp)
            except Exception:
                return queryset.none()

        return queryset

    @action(detail=False, methods=['get'], url_path='monthly-summary')
    def monthly_summary(self, request):
        """Return a breakdown of attendance statuses for a given month/year."""
        month = request.query_params.get('month', timezone.now().month)
        year = request.query_params.get('year', timezone.now().year)
        employee_id = request.query_params.get('employee')

        queryset = Attendance.objects.filter(date__month=month, date__year=year)

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        elif request.user.role != 'admin':
            try:
                emp = request.user.employee_profile
                queryset = queryset.filter(employee=emp)
            except Exception:
                return Response({'error': 'Employee profile not linked.'}, status=404)

        present = queryset.filter(status='present').count()
        absent = queryset.filter(status='absent').count()
        wfh = queryset.filter(status='wfh').count()
        half_day = queryset.filter(status='half_day').count()

        return Response({
            'month': int(month),
            'year': int(year),
            'present': present,
            'absent': absent,
            'wfh': wfh,
            'half_day': half_day,
            'total': present + absent + wfh + half_day,
        })

    @action(detail=False, methods=['get'], url_path='today',
            permission_classes=[IsAuthenticated, IsAdminRole])
    def today_summary(self, request):
        """Admin dashboard: attendance summary for today."""
        today = timezone.now().date()
        records = Attendance.objects.filter(date=today)
        total_active = Employee.objects.filter(employment_status='active').count()

        return Response({
            'date': today,
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'wfh': records.filter(status='wfh').count(),
            'half_day': records.filter(status='half_day').count(),
            'total_active_employees': total_active,
            'not_marked': max(0, total_active - records.count()),
        })
