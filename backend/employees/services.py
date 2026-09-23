"""Business logic for the employees domain.

Views handle HTTP concerns (routing, permissions, serialization).
Queries and aggregates that answer business questions live here so they
can be reused by views, admin actions, and tests without duplication.
"""

from django.db.models import Count

from .models import Employee


def employee_counts():
    """Return headcount totals broken down by employment status."""
    return {
        'total': Employee.objects.count(),
        'active': Employee.objects.filter(employment_status='active').count(),
        'inactive': Employee.objects.filter(employment_status='inactive').count(),
        'terminated': Employee.objects.filter(employment_status='terminated').count(),
        'on_leave': Employee.objects.filter(employment_status='on_leave').count(),
    }


def department_breakdown():
    """Return per-department headcount ordered by size, largest first."""
    return list(
        Employee.objects.values('department')
        .annotate(count=Count('id'))
        .order_by('-count')
    )


def employee_dashboard_stats():
    """Combined payload consumed by the admin dashboard stats endpoint."""
    counts = employee_counts()
    counts['department_breakdown'] = department_breakdown()
    return counts


def get_employee_for_user(user):
    """Return the Employee linked to a user, or None when unlinked."""
    try:
        return user.employee_profile
    except Employee.DoesNotExist:
        return None
