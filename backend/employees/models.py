from django.db import models
from accounts.models import CustomUser


DEPARTMENT_CHOICES = [
    ('engineering', 'Engineering'),
    ('human_resources', 'Human Resources'),
    ('finance', 'Finance'),
    ('marketing', 'Marketing'),
    ('sales', 'Sales'),
    ('operations', 'Operations'),
    ('design', 'Design'),
    ('legal', 'Legal'),
    ('other', 'Other'),
]

EMPLOYMENT_STATUS_CHOICES = [
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('terminated', 'Terminated'),
    ('on_leave', 'On Leave'),
]


class Employee(models.Model):
    employee_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employee_profile',
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    designation = models.CharField(max_length=100)
    joining_date = models.DateField()
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    employment_status = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_STATUS_CHOICES,
        default='active',
    )
    profile_picture = models.ImageField(
        upload_to='employee_profiles/',
        blank=True,
        null=True,
    )
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def save(self, *args, **kwargs):
        if not self.employee_id:
            # Generate a sequential EMP-ID
            last = Employee.objects.order_by('id').last()
            next_id = (last.id + 1) if last else 1
            self.employee_id = f'EMP{next_id:04d}'
        super().save(*args, **kwargs)

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def __str__(self):
        return f'{self.employee_id} — {self.get_full_name()}'
