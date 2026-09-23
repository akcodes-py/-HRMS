from django.utils import timezone

from rest_framework import serializers
from .models import Attendance
from employees.serializers import EmployeeListSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    employee_data = EmployeeListSerializer(source='employee', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_data',
            'date', 'status', 'status_display',
            'check_in', 'check_out', 'remarks',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        instance = self.instance
        employee = data.get('employee', getattr(instance, 'employee', None))
        date = data.get('date', getattr(instance, 'date', None))

        if date and date > timezone.now().date():
            raise serializers.ValidationError(
                {'date': 'Attendance date cannot be in the future.'}
            )

        if employee and date:
            qs = Attendance.objects.filter(employee=employee, date=date)
            if instance:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f'Attendance for {employee} on {date} already exists.'
                )

        check_in = data.get('check_in', getattr(instance, 'check_in', None))
        check_out = data.get('check_out', getattr(instance, 'check_out', None))
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError(
                {'check_out': 'Check-out must be after check-in.'}
            )
        return data
