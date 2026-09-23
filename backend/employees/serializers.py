from django.utils import timezone

from rest_framework import serializers
from .models import Employee
from accounts.serializers import UserSerializer


class EmployeeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer used for list views."""
    full_name = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    status_display = serializers.CharField(source='get_employment_status_display', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'full_name', 'first_name', 'last_name',
            'email', 'phone', 'department', 'department_display',
            'designation', 'employment_status', 'status_display',
            'profile_picture', 'joining_date',
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()


class EmployeeSerializer(serializers.ModelSerializer):
    """Full serializer with nested user data for detail/create/edit views."""
    full_name = serializers.SerializerMethodField()
    department_display = serializers.CharField(source='get_department_display', read_only=True)
    status_display = serializers.CharField(source='get_employment_status_display', read_only=True)
    user_data = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'user', 'user_data',
            'first_name', 'last_name', 'full_name',
            'email', 'phone', 'department', 'department_display',
            'designation', 'joining_date', 'salary',
            'employment_status', 'status_display',
            'profile_picture', 'address',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['employee_id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def validate_salary(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Salary cannot be negative.')
        return value

    def validate_joining_date(self, value):
        if value and value > timezone.now().date():
            raise serializers.ValidationError('Joining date cannot be in the future.')
        return value
