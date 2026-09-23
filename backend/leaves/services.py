"""Business logic for the leave domain.

Approval rules live here — not in views — so the "only pending leaves
can transition" invariant is enforced in exactly one place.
"""

from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import Leave


def approve_leave(*, leave, reviewer):
    """Approve a pending leave request."""
    if leave.status != Leave.STATUS_PENDING:
        raise ValidationError('Only pending leaves can be approved.')
    leave.status = Leave.STATUS_APPROVED
    leave.reviewed_by = reviewer
    leave.reviewed_on = timezone.now()
    leave.save()
    return leave


def reject_leave(*, leave, reviewer, rejection_reason=''):
    """Reject a pending leave request with an optional reason."""
    if leave.status != Leave.STATUS_PENDING:
        raise ValidationError('Only pending leaves can be rejected.')
    leave.status = Leave.STATUS_REJECTED
    leave.reviewed_by = reviewer
    leave.reviewed_on = timezone.now()
    leave.rejection_reason = rejection_reason or ''
    leave.save()
    return leave
