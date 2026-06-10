from rest_framework import serializers
from .models import Leave
from employees.serializers import EmployeeListSerializer
from accounts.serializers import UserSerializer


class LeaveSerializer(serializers.ModelSerializer):
    employee_data = EmployeeListSerializer(source='employee', read_only=True)
    reviewed_by_data = UserSerializer(source='reviewed_by', read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration = serializers.IntegerField(read_only=True)

    class Meta:
        model = Leave
        fields = [
            'id', 'employee', 'employee_data',
            'leave_type', 'leave_type_display',
            'start_date', 'end_date', 'duration',
            'reason', 'status', 'status_display',
            'applied_on',
            'reviewed_by', 'reviewed_by_data', 'reviewed_on',
            'rejection_reason',
        ]
        read_only_fields = ['applied_on', 'reviewed_by', 'reviewed_on', 'status']

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'end_date': 'End date must be on or after start date.'})
        return data
