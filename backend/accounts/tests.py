"""Tests for accounts: roles, registration, profile, password, logout."""

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomUser


def make_user(username='admin1', role='admin', password='pass12345'):
    return CustomUser.objects.create_user(
        username=username,
        password=password,
        role=role,
        email=f'{username}@example.com',
    )


class CustomUserModelTests(APITestCase):
    def test_is_admin_user_reflects_role(self):
        admin = make_user('a1', role='admin')
        emp = make_user('e1', role='employee')
        self.assertTrue(admin.is_admin_user())
        self.assertFalse(emp.is_admin_user())

    def test_str_includes_role(self):
        user = make_user('a2', role='admin')
        self.assertIn('admin', str(user))


class RegisterViewTests(APITestCase):
    def setUp(self):
        self.admin = make_user('admin', role='admin')
        self.employee = make_user('emp', role='employee')
        self.url = reverse('register')

    def payload(self, username='newuser'):
        return {
            'username': username,
            'email': f'{username}@example.com',
            'password': 'strongpass1',
            'password2': 'strongpass1',
            'role': 'employee',
        }

    def test_unauthenticated_cannot_register(self):
        response = self.client.post(self.url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_employee_cannot_register(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(self.url, self.payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_register(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.payload('fresh1'), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(CustomUser.objects.filter(username='fresh1').exists())

    def test_password_mismatch_rejected(self):
        self.client.force_authenticate(user=self.admin)
        payload = self.payload('fresh2')
        payload['password2'] = 'different1'
        response = self.client.post(self.url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTests(APITestCase):
    def test_me_requires_auth(self):
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_current_user(self):
        user = make_user('me1', role='employee')
        self.client.force_authenticate(user=user)
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'me1')

    def test_me_patch_updates_profile(self):
        user = make_user('me2', role='employee')
        self.client.force_authenticate(user=user)
        response = self.client.patch(
            reverse('me'), {'first_name': 'Ada', 'phone': '123'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.first_name, 'Ada')


class ChangePasswordTests(APITestCase):
    def test_change_password_success(self):
        user = make_user('pw1', password='oldpass123')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse('change_password'),
            {
                'old_password': 'oldpass123',
                'new_password': 'newpass123',
                'new_password2': 'newpass123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('newpass123'))

    def test_wrong_old_password_rejected(self):
        user = make_user('pw2', password='oldpass123')
        self.client.force_authenticate(user=user)
        response = self.client.post(
            reverse('change_password'),
            {
                'old_password': 'wrongpass',
                'new_password': 'newpass123',
                'new_password2': 'newpass123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutAndUserListTests(APITestCase):
    def test_logout_requires_refresh_token(self):
        user = make_user('lo1')
        self.client.force_authenticate(user=user)
        response = self.client.post(reverse('logout'), {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_list_admin_only(self):
        make_user('adm', role='admin')
        emp = make_user('emp9', role='employee')
        self.client.force_authenticate(user=emp)
        response = self.client.get(reverse('user_list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
