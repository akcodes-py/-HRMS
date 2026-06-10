from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = [
        'employee_id', 'get_full_name', 'email', 'department',
        'designation', 'employment_status', 'joining_date',
    ]
    list_filter = ['department', 'employment_status', 'joining_date']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email', 'designation']
    ordering = ['-created_at']
    readonly_fields = ['employee_id', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Info', {
            'fields': ('employee_id', 'user', 'first_name', 'last_name', 'profile_picture'),
        }),
        ('Contact', {
            'fields': ('email', 'phone', 'address'),
        }),
        ('Employment', {
            'fields': ('department', 'designation', 'joining_date', 'salary', 'employment_status'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Name'
