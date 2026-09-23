"""Tests for leaves: validation, approve/reject flow, permissions."""

from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from employees.models import Employee
from leaves.models import Leave


def make_user(username, role='admin'):
    return CustomUser.objects.create_user(
        username=username, password='pass12345', role=role,
        email=f'{username}@example.com',
    )


def make_employee(email, user=None):
    return Employee.objects.create(
        user=user,
        first_name='Lea',
        last_name='Ver',
        email=email,
        department='engineering',
        designation='Engineer',
        joining_date=date.today() - timedelta(days=60),
        salary=40000,
        employment_status='active',
    )


def make_leave(employee, start=None, end=None, leave_status='pending'):
    start = start or (date.today() + timedelta(days=1))
    end = end or (date.today() + timedelta(days=2))
    return Leave.objects.create(
        employee=employee,
        leave_type='casual',
        start_date=start,
        end_date=end,
        reason='Family function attendance',
        status=leave_status,
    )


class LeaveApiTests(APITestCase):
    def setUp(self):
        self.admin = make_user('adm_l', role='admin')
        self.emp_user = make_user('emp_l', role='employee')
        self.emp = make_employee('leave_emp@example.com', user=self.emp_user)
        self.other = make_employee('leave_other@example.com')
        self.list_url = reverse('leave-list')

    def payload(self):
        return {
            'employee': self.emp.pk,
            'leave_type': 'casual',
            'start_date': str(date.today() + timedelta(days=1)),
            'end_date': str(date.today() + timedelta(days=2)),
            'reason': 'Family function attendance',
        }

    def test_requires_auth(self):
        self.assertEqual(
            self.client.get(self.list_url).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_create_defaults_to_pending(self):
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_cannot_force_approved_on_create(self):
        self.client.force_authenticate(user=self.emp_user)
        payload = self.payload()
        payload['status'] = 'approved'
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_end_before_start_rejected(self):
        self.client.force_authenticate(user=self.emp_user)
        payload = self.payload()
        payload['start_date'] = str(date.today() + timedelta(days=5))
        payload['end_date'] = str(date.today() + timedelta(days=2))
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_excessive_duration_rejected(self):
        self.client.force_authenticate(user=self.emp_user)
        payload = self.payload()
        payload['end_date'] = str(date.today() + timedelta(days=200))
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_approve_flow(self):
        leave = make_leave(self.emp)
        url = reverse('leave-approve', args=[leave.pk])
        self.client.force_authenticate(user=self.emp_user)
        self.assertEqual(
            self.client.post(url).status_code, status.HTTP_403_FORBIDDEN
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')
        second = self.client.post(url)
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reject_flow_with_reason(self):
        leave = make_leave(self.emp)
        url = reverse('leave-reject', args=[leave.pk])
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            url, {'rejection_reason': 'Sprint deadline coverage'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rejected')
        leave.refresh_from_db()
        self.assertEqual(leave.rejection_reason, 'Sprint deadline coverage')

    def test_employee_isolation(self):
        make_leave(self.emp)
        make_leave(self.other)
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.get(self.list_url)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(len(results) >= 1)
        for row in results:
            self.assertEqual(row['employee'], self.emp.pk)

    def test_pending_count_and_summary_admin_only(self):
        make_leave(self.emp)
        self.client.force_authenticate(user=self.emp_user)
        self.assertEqual(
            self.client.get(reverse('leave-pending-count')).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('leave-pending-count'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('pending_count', response.data)

    def test_duration_property(self):
        leave = make_leave(
            self.emp,
            start=date(2026, 1, 10),
            end=date(2026, 1, 12),
        )
        self.assertEqual(leave.duration, 3)
