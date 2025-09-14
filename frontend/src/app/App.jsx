import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

import {
  AdminPanel,
  AdminRoute,
  Login,
  Register,
  TokenManager,
  ImageViewer,
  SearchBlock,
  FileUploaderModal,
  PreviewModal
} from '@components';

import { getApiBaseUrl } from '@utils/env';
import { VK } from '@api/services/integrations/VK.js';
import { createRequest } from '@api/core/createRequest.js';

const API_BASE_URL = getApiBaseUrl();

const ImageViewerWithRef = React.forwardRef((props, ref) => (
  <ImageViewer ref={ref} {...props} />
));

export default function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [loading, setLoading] = useState(true);

  const imageViewerRef = useRef();
  const fileUploaderModalRef = useRef();
  const previewModalRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await createRequest({
            url: `${API_BASE_URL}/api/auth/me`,
            method: 'GET'
          });

          if (response && response.user) {
            const normalizedUser = {
              ...response.user,
              firstName: response.user.first_name || response.user.firstName,
              lastName: response.user.last_name || response.user.lastName
            };
            setUser(normalizedUser);
          }
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await createRequest({
        url: `${API_BASE_URL}/api/auth/logout`,
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const handleReplace = (userId) => {
    VK.get(userId, (maxSizeImagesUrls) => {
      if (imageViewerRef.current) {
        imageViewerRef.current.clear();
        imageViewerRef.current.drawImages(maxSizeImagesUrls);
      }
    });
  };

  const handleAdd = (userId) => {
    VK.get(userId, (maxSizeImagesUrls) => {
      if (imageViewerRef.current) {
        imageViewerRef.current.drawImages(maxSizeImagesUrls);
      }
    });
  };

  const handleShowUploaded = () => {
    previewModalRef.current?.open();
  };

  const handleSendImages = (images) => {
    fileUploaderModalRef.current?.showImages(images);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="app-container">
        <header className="app-header">
          <a href="#" className="logo">
            <div className="logo-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <div className="logo-text">VKDrive</div>
          </a>
        </header>

        <div className="auth-tabs">
          <button
            className={showLogin ? 'active' : ''}
            onClick={() => setShowLogin(true)}
          >
            Вход
          </button>
          <button
            className={!showLogin ? 'active' : ''}
            onClick={() => setShowLogin(false)}
          >
            Регистрация
          </button>
        </div>

        {showLogin ? (
          <Login onLogin={setUser} />
        ) : (
          <Register onRegister={setUser} />
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/admin" element={
          <AdminRoute user={user}>
            <div>
              <header className="app-header">
                <a href="#" className="logo">
                  <div className="logo-icon">
                    <i className="fas fa-cloud-upload-alt"></i>
                  </div>
                  <div className="logo-text">VKDrive</div>
                </a>

                <div className="user-menu">
                  <span>Добро пожаловать, {user.firstName || user.email}</span>
                  <button onClick={() => navigate('/')} className="admin-panel-btn">
                    На главную
                  </button>
                  <button onClick={handleLogout} className="logout-btn">
                    Выход
                  </button>
                </div>
              </header>
              <AdminPanel user={user} />
            </div>
          </AdminRoute>
        } />

        <Route path="/*" element={
          <>
            <header className="app-header">
              <a href="#" className="logo">
                <div className="logo-icon">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <div className="logo-text">VKDrive</div>
              </a>

              <div className="user-menu">
                <span>Добро пожаловать, {user.firstName || user.email}</span>
                {user.role === 'admin' && (
                  <div className="admin-link">
                    <button
                      onClick={() => navigate('/admin')}
                      className="admin-panel-btn"
                    >
                      Панель администратора
                    </button>
                  </div>
                )}
                <button onClick={handleLogout} className="logout-btn">
                  Выход
                </button>
              </div>
            </header>

            <div className="settings-section">
              <TokenManager />
            </div>

            <SearchBlock
              onReplace={handleReplace}
              onAdd={handleAdd}
            />

            <ImageViewerWithRef
              ref={imageViewerRef}
              onShowUploaded={handleShowUploaded}
              onSendImages={handleSendImages}
            />
          </>
        } />
      </Routes>

      <FileUploaderModal ref={fileUploaderModalRef} />
      <PreviewModal ref={previewModalRef} />
    </div>
  );
}
