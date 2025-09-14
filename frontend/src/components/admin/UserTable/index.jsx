import React from 'react';

import { usersApi } from '@api/services/users/index.js';
import ChangePasswordModal from '../../common/ChangePasswordModal';

export default class UserTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      currentUser: null,
      pagination: {
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 0
      },
      filters: {
        search: '',
        role: '',
        is_active: ''
      },
      changingPasswordUser: null,
    };
  }

  async componentDidMount() {
    await this.loadUsers();
  }

  loadUsers = async (page = 1) => {
    try {
      this.setState({ loading: true });
      const { filters, pagination } = this.state;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', pagination.limit);
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.is_active) queryParams.append('is_active', filters.is_active);

      const response = await usersApi.getUsers(`?${queryParams.toString()}`);
      
      if (response && response.users) {
        this.setState({ 
          users: response.users,
          pagination: response.pagination || {
            page: page,
            limit: pagination.limit,
            total: response.users.length,
            totalPages: 1
          }
        });
      } else {
        this.setState({ 
          users: [],
          pagination: {
            page: 1,
            limit: pagination.limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    } catch (error) {
      console.error('Error loading users:', error);
      this.setState({ 
        users: [],
        loading: false 
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleFilterChange = (field, value) => {
    this.setState(prevState => ({
      filters: {
        ...prevState.filters,
        [field]: value
      }
    }), () => this.loadUsers(1));
  };

  handleToggleActive = async (user) => {
    try {
      await usersApi.toggleUserActive(user.id, !user.is_active);
      await this.loadUsers(this.state.pagination.page);
      alert(`Пользователь ${user.is_active ? 'деактивирован' : 'активирован'} успешно`);
    } catch (error) {
      console.error('Error toggling user active status:', error);
      alert('Ошибка изменения статуса пользователя');
    }
  };

  handleChangePassword = async (newPassword) => {
    const { changingPasswordUser } = this.state;
    
    try {
      await usersApi.changeUserPassword(changingPasswordUser.id, newPassword);
      this.setState({ changingPasswordUser: null });
      alert('Пароль успешно изменен');
      await this.loadUsers(this.state.pagination.page);
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Ошибка изменения пароля: ' + (error.responseData?.error || error.message));
    }
  };

  renderPagination() {
    const { pagination } = this.state;
    
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button 
          onClick={() => this.loadUsers(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          ←
        </button>
        
        <span>Страница<br/> {pagination.page} из {pagination.totalPages}</span>
        
        <button 
          onClick={() => this.loadUsers(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          →
        </button>
      </div>
    );
  }

  render() {
    const { users, loading, filters, changingPasswordUser, pagination } = this.state;
    const { currentUser } = this.props; 
    
    return (
      <div className="user-management">
        <div className="filters">
          <input
            type="text"
            placeholder="Поиск по email, имени, фамилии или ID"
            value={filters.search}
            onChange={(e) => this.handleFilterChange('search', e.target.value)}
          />
          
          <select
            value={filters.role}
            onChange={(e) => this.handleFilterChange('role', e.target.value)}
          >
            <option value="">Все роли</option>
            <option value="user">Пользователь</option>
            <option value="admin">Администратор</option>
          </select>
          
          <select
            value={filters.is_active}
            onChange={(e) => this.handleFilterChange('is_active', e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="true">Активные</option>
            <option value="false">Неактивные</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <>
            <div className="table-info">
              <span>Найдено пользователей: {pagination?.total || 0}</span>
            </div>
            
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Статус</th>
                  <th>Дата регистрации</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.first_name} {user.last_name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role ${user.role}`}>
                          {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                          {user.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">

                          {user.role !== 'admin' && (
                            <button
                              onClick={() => this.handleToggleActive(user)}
                              className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                            >
                              {user.is_active ? 'Деактивировать' : 'Активировать'}
                            </button>
                          )}

                          {console.log('Current user:', currentUser, 'Table user:', user)}
                          {(user.role !== 'admin' || (currentUser &&  (currentUser.id === user.id))) && (
                            <button
                              onClick={() => this.setState({ changingPasswordUser: user })}
                              className="btn btn-sm btn-info"
                            >
                              Сменить пароль
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {this.renderPagination()}
          </>
        )}

        {changingPasswordUser && (
          <ChangePasswordModal
            user={changingPasswordUser}
            onSubmit={this.handleChangePassword}
            onCancel={() => this.setState({ changingPasswordUser: null })}
          />
        )}
      </div>
    );
  }
}