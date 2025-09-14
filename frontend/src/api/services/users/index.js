import { getApiBaseUrl } from '@utils/env';
import { createRequest } from '../../core/createRequest';

const API_BASE_URL = getApiBaseUrl();

export const usersApi = {
  getUsers: (query = '') => createRequest({
    url: `${API_BASE_URL}/api/users${query}`,
    method: 'GET'
  }),

  createAdmin: (userData) => createRequest({
    url: `${API_BASE_URL}/api/users`,
    method: 'POST',
    data: userData
  }),

  updateUser: (id, userData) => createRequest({
    url: `${API_BASE_URL}/api/users/${id}`,
    method: 'PUT',
    data: userData
  }),

  toggleUserActive: (id, isActive) => createRequest({
    url: `${API_BASE_URL}/api/users/${id}/active`,
    method: 'PUT',
    data: { isActive }
  }),

  changeUserRole: (id, role) => createRequest({
    url: `${API_BASE_URL}/api/users/${id}/role`,
    method: 'PUT',
    data: { role }
  }),

  changeUserPassword: (id, password) => createRequest({
    url: `${API_BASE_URL}/api/users/${id}/password`,
    method: 'PUT',
    data: { password }
  })
};
