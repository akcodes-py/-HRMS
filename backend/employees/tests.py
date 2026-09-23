"""Tests for employees: model, validation, permissions, stats."""

from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser
from employees.models import Employee


def make_user(username, role='admin'):
    return CustomUser.objects.create_user(
        username=username,
        password='pass12345',
        role=role,
        email=f'{username}@example.com',
    )


def make_employee(email='a@example.com', department='engineering', emp_status='active', user=None):
    return Employee.objects.create(
        user=user,
        first_name='Test',
        last_name='User',
        email=email,
        department=department,
        designation='Engineer',
        joining_date=date.today() - timedelta(days=30),
        salary=50000,
        employment_status=emp_status,
    )


class EmployeeModelTests(APITestCase):
    def test_employee_id_generated_from_pk(self):
        emp = make_employee(email='gen1@example.com')
        self.assertTrue(emp.employee_id.startswith('EMP'))
        self.assertEqual(emp.employee_id, f'EMP{emp.pk:04d}')

    def test_employee_ids_unique(self):
        e1 = make_employee(email='u1@example.com')
        e2 = make_employee(email='u2@example.com')
        self.assertNotEqual(e1.employee_id, e2.employee_id)

    def test_full_name_and_str(self):
        emp = make_employee(email='u3@example.com')
        self.assertEqual(emp.get_full_name(), 'Test User')
        self.assertIn(emp.employee_id, str(emp))


class EmployeeApiTests(APITestCase):
    def setUp(self):
        self.admin = make_user('admin_e', role='admin')
        self.employee_user = make_user('emp_e', role='employee')
        self.list_url = reverse('employee-list')

    def payload(self, email='new@example.com'):
        return {
            'first_name': 'New',
            'last_name': 'Hire',
            'email': email,
            'department': 'engineering',
            'designation': 'Developer',
            'joining_date': str(date.today() - timedelta(days=10)),
            'salary': '60000.00',
            'employment_status': 'active',
        }

    def test_list_requires_auth(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_can_list_but_cannot_create(self):
        self.client.force_authenticate(user=self.employee_user)
        self.assertEqual(self.client.get(self.list_url).status_code, status.HTTP_200_OK)
        response = self.client.post(self.list_url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            self.list_url, self.payload('hire1@example.com'), format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['employee_id'].startswith('EMP'))

    def test_negative_salary_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self.payload('neg@example.com')
        payload['salary'] = '-100.00'
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('salary', response.data)

    def test_future_joining_date_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self.payload('fut@example.com')
        payload['joining_date'] = str(date.today() + timedelta(days=5))
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('joining_date', response.data)

    def test_filter_by_department_and_status(self):
        make_employee(email='f1@example.com', department='engineering', emp_status='active')
        make_employee(email='f2@example.com', department='finance', emp_status='inactive')
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.list_url + '?department=finance')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results'] if 'results' in response.data else response.data
        self.assertTrue(all(r['department'] == 'finance' for r in results))

    def test_stats_admin_only(self):
        make_employee(email='s1@example.com')
        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(reverse('employee-stats'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('employee-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('department_breakdown', response.data)

    def test_my_profile_linked_and_unlinked(self):
        linked_user = make_user('linked', role='employee')
        make_employee(email='linked@example.com', user=linked_user)
        self.client.force_authenticate(user=linked_user)
        response = self.client.get(reverse('employee-my-profile'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'linked@example.com')

        self.client.force_authenticate(user=self.employee_user)
        response = self.client.get(reverse('employee-my-profile'))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_and_delete_admin_only(self):
        emp = make_employee(email='upd@example.com')
        detail = reverse('employee-detail', args=[emp.pk])
        self.client.force_authenticate(user=self.employee_user)
        self.assertEqual(
            self.client.patch(detail, {'designation': 'X'}, format='json').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.delete(detail).status_code, status.HTTP_403_FORBIDDEN
        )
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(
            self.client.patch(detail, {'designation': 'Senior'}, format='json').status_code,
            status.HTTP_200_OK,
        )
