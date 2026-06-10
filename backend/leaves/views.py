from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Leave
from .serializers import LeaveSerializer
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
        if self.action in ['destroy', 'approve', 'reject']:
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
            try:
                emp = self.request.user.employee_profile
                queryset = queryset.filter(employee=emp)
            except Exception:
                return queryset.none()

        return queryset

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != Leave.STATUS_PENDING:
            return Response(
                {'error': 'Only pending leaves can be approved.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.status = Leave.STATUS_APPROVED
        leave.reviewed_by = request.user
        leave.reviewed_on = timezone.now()
        leave.save()
        return Response(LeaveSerializer(leave, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != Leave.STATUS_PENDING:
            return Response(
                {'error': 'Only pending leaves can be rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.status = Leave.STATUS_REJECTED
        leave.reviewed_by = request.user
        leave.reviewed_on = timezone.now()
        leave.rejection_reason = request.data.get('rejection_reason', '')
        leave.save()
        return Response(LeaveSerializer(leave, context={'request': request}).data)

    @action(detail=False, methods=['get'], url_path='pending-count',
            permission_classes=[IsAuthenticated, IsAdminRole])
    def pending_count(self, request):
        count = Leave.objects.filter(status=Leave.STATUS_PENDING).count()
        return Response({'pending_count': count})

    @action(detail=False, methods=['get'], url_path='summary',
            permission_classes=[IsAuthenticated, IsAdminRole])
    def summary(self, request):
        """Recent pending leave requests for admin dashboard."""
        pending = Leave.objects.filter(status=Leave.STATUS_PENDING).order_by('-applied_on')[:5]
        return Response(LeaveSerializer(pending, many=True, context={'request': request}).data)
