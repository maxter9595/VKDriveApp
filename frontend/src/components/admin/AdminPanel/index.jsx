import React from 'react';

import UserTable from '../UserTable';
import CreateAdminForm  from '../CreateAdminForm';
import { usersApi } from '@api/services/users/index.js';

export default class AdminPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      showCreateForm: false,
      loading: true,
      error: ''
    };
  }

  async componentDidMount() {
    await this.loadUsers();
  }

  loadUsers = async () => {
    try {
      this.setState({ loading: true });
      const response = await usersApi.getUsers();
      console.log(response);
      if (response && response.users) {
        this.setState({ users: response.users.filter(user => user.role !== 'admin') });
      }
    } catch (error) {
      console.error("Error loading users:", error);
      this.setState({ error: 'Ошибка загрузки пользователей' });
    } finally {
      this.setState({ loading: false });
    }
  };

  handleCreateAdmin = async (userData) => {
    try {
      await usersApi.createAdmin(userData);
      this.setState({ showCreateForm: false });
      await this.loadUsers();

      alert('Администратор успешно создан');
    } catch (error) {
      alert(error.message);
    }
  };

  render() {
    const { users, showCreateForm, loading, error } = this.state;
    const { user } = this.props;

    return (
      <div className="admin-panel">
        <div className="admin-header">
          <h2>Панель администратора</h2>
          {!showCreateForm && (
            <button 
              className="btn btn-primary"
              onClick={() => this.setState({ showCreateForm: true })}
            >
              Создать администратора
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {showCreateForm ? (
          <div className="create-admin-section">
            <CreateAdminForm
              onSubmit={this.handleCreateAdmin}
              onCancel={() => this.setState({ showCreateForm: false })}
            />
          </div>
        ) : (
          <div className="users-section">
            {loading ? (
              <div className="loading">Загрузка...</div>
            ) : (
              <UserTable 
                users={users}
                onUserUpdated={this.loadUsers}
                currentUser={user}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}
