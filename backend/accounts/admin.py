from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = UserAdmin.fieldsets + (
        ('HRMS Info', {
            'fields': ('role', 'phone', 'profile_picture', 'department'),
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('HRMS Info', {
            'fields': ('email', 'first_name', 'last_name', 'role', 'phone', 'department'),
        }),
    )
