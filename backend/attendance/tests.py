"""Tests for attendance: validation, isolation, summaries."""

from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from attendance.models import Attendance
from employees.models import Employee


def make_user(username, role='admin'):
    return CustomUser.objects.create_user(
        username=username, password='pass12345', role=role,
        email=f'{username}@example.com',
    )


def make_employee(email, user=None):
    return Employee.objects.create(
        user=user,
        first_name='Att',
        last_name='End',
        email=email,
        department='engineering',
        designation='Engineer',
        joining_date=date.today() - timedelta(days=60),
        salary=40000,
        employment_status='active',
    )


class AttendanceApiTests(APITestCase):
    def setUp(self):
        self.admin = make_user('adm_a', role='admin')
        self.emp_user = make_user('emp_a', role='employee')
        self.emp = make_employee('att_emp@example.com', user=self.emp_user)
        self.other = make_employee('att_other@example.com')
        self.list_url = reverse('attendance-list')
        self.today = date.today() - timedelta(days=1)

    def payload(self, employee=None, day=None, att_status='present'):
        return {
            'employee': (employee or self.emp).pk,
            'date': str(day or self.today),
            'status': att_status,
            'check_in': '09:00:00',
            'check_out': '17:00:00',
        }

    def test_requires_auth(self):
        self.assertEqual(
            self.client.get(self.list_url).status_code, status.HTTP_401_UNAUTHORIZED
        )

    def test_create_and_duplicate_rejected(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        dup = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_future_date_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self.payload(day=date.today() + timedelta(days=3))
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', response.data)

    def test_checkout_before_checkin_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self.payload()
        payload['check_in'] = '17:00:00'
        payload['check_out'] = '09:00:00'
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('check_out', response.data)

    def test_employee_sees_only_own_records(self):
        Attendance.objects.create(
            employee=self.emp, date=self.today, status='present'
        )
        Attendance.objects.create(
            employee=self.other, date=self.today, status='present'
        )
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(len(results) >= 1)
        for row in results:
            self.assertEqual(row['employee'], self.emp.pk)

    def test_monthly_summary_counts(self):
        Attendance.objects.create(employee=self.emp, date=self.today, status='present')
        self.client.force_authenticate(user=self.admin)
        url = reverse('attendance-monthly-summary')
        response = self.client.get(
            f'{url}?month={self.today.month}&year={self.today.year}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(response.data['present'], 1)
        self.assertIn('total', response.data)

    def test_today_summary_admin_only(self):
        self.client.force_authenticate(user=self.emp_user)
        response = self.client.get(reverse('attendance-today-summary'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('attendance-today-summary'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('present', response.data)
        self.assertIn('not_marked', response.data)

    def test_update_delete_admin_only(self):
        record = Attendance.objects.create(
            employee=self.emp, date=self.today, status='present'
        )
        detail = reverse('attendance-detail', args=[record.pk])
        self.client.force_authenticate(user=self.emp_user)
        self.assertEqual(
            self.client.patch(detail, {'status': 'absent'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(
            self.client.patch(detail, {'status': 'absent'}, format='json').status_code,
            status.HTTP_200_OK,
        )
