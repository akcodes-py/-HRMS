"""Business logic for the attendance domain."""

from django.utils import timezone

from employees.models import Employee

from .models import Attendance


def monthly_summary(*, month, year, employee_id=None):
    """Count attendance records by status for a calendar month."""
    queryset = Attendance.objects.filter(date__month=month, date__year=year)
    if employee_id:
        queryset = queryset.filter(employee_id=employee_id)
    present = queryset.filter(status=Attendance.STATUS_PRESENT).count()
    absent = queryset.filter(status=Attendance.STATUS_ABSENT).count()
    wfh = queryset.filter(status=Attendance.STATUS_WFH).count()
    half_day = queryset.filter(status=Attendance.STATUS_HALF_DAY).count()
    return {
        'month': int(month),
        'year': int(year),
        'present': present,
        'absent': absent,
        'wfh': wfh,
        'half_day': half_day,
        'total': present + absent + wfh + half_day,
    }


def today_summary():
    """Admin overview: today's attendance vs total active headcount."""
    today = timezone.now().date()
    records = Attendance.objects.filter(date=today)
    total_active = Employee.objects.filter(employment_status='active').count()
    return {
        'date': today,
        'present': records.filter(status=Attendance.STATUS_PRESENT).count(),
        'absent': records.filter(status=Attendance.STATUS_ABSENT).count(),
        'wfh': records.filter(status=Attendance.STATUS_WFH).count(),
        'half_day': records.filter(status=Attendance.STATUS_HALF_DAY).count(),
        'total_active_employees': total_active,
        'not_marked': max(0, total_active - records.count()),
    }
