from django.db import models
from employees.models import Employee
from accounts.models import CustomUser


class Leave(models.Model):
    LEAVE_SICK = 'sick'
    LEAVE_CASUAL = 'casual'
    LEAVE_ANNUAL = 'annual'
    LEAVE_OTHER = 'other'

    LEAVE_TYPE_CHOICES = [
        (LEAVE_SICK, 'Sick Leave'),
        (LEAVE_CASUAL, 'Casual Leave'),
        (LEAVE_ANNUAL, 'Annual Leave'),
        (LEAVE_OTHER, 'Other'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='leaves',
    )
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    applied_on = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leaves',
    )
    reviewed_on = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-applied_on']
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'

    @property
    def duration(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f'{self.employee.employee_id} | {self.leave_type} | {self.status}'
