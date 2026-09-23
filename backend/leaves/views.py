from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Leave
from .serializers import LeaveSerializer
from .services import approve_leave, reject_leave
from employees.services import get_employee_for_user
from accounts.permissions import IsAdminRole


class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.select_related('employee', 'reviewed_by').all()
    serializer_class = LeaveSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'employee__first_name', 'employee__last_name',
        'employee__employee_id', 'leave_type', 'status',
    ]
    ordering_fields = ['applied_on', 'start_date', 'status', 'leave_type']
    ordering = ['-applied_on']

    def get_permissions(self):
        # See employees.views for why admin actions are listed here rather
        # than on @action(permission_classes=...).
        if self.action in [
            'destroy', 'approve', 'reject', 'pending_count', 'summary'
        ]:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee')
        leave_status = self.request.query_params.get('status')
        leave_type = self.request.query_params.get('leave_type')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if leave_status:
            queryset = queryset.filter(status=leave_status)
        if leave_type:
            queryset = queryset.filter(leave_type=leave_type)

        # Employees see only their own leaves
        if self.request.user.role != 'admin':
            emp = get_employee_for_user(self.request.user)
            if emp is None:
                return queryset.none()
            queryset = queryset.filter(employee=emp)

        return queryset

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        leave = self.get_object()
        updated = approve_leave(leave=leave, reviewer=request.user)
        return Response(LeaveSerializer(updated, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        leave = self.get_object()
        updated = reject_leave(
            leave=leave,
            reviewer=request.user,
            rejection_reason=request.data.get('rejection_reason', ''),
        )
        return Response(LeaveSerializer(updated, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='pending-count')
    def pending_count(self, request):
        count = Leave.objects.filter(status=Leave.STATUS_PENDING).count()
        return Response({'pending_count': count})

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Recent pending leave requests for admin dashboard."""
        pending = Leave.objects.filter(status=Leave.STATUS_PENDING).order_by('-applied_on')[:5]
        return Response(LeaveSerializer(pending, many=True, context={'request': request}).data)
