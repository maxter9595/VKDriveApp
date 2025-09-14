export const createRequest = async (options = {}) => {
  try {
    let url = options.url;
    
    if (options.data && options.method === 'GET') {
      const params = new URLSearchParams(options.data).toString();
      url += '?' + params;
    }

    const config = {
      method: options.method,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include'
    };

    if (options.data && options.method !== 'GET') {
      config.body = JSON.stringify(options.data);
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorText = '';
      let errorData = null;
      
      try {
        errorData = await response.json();
        errorText = errorData.message || errorData.description || JSON.stringify(errorData);
      } catch (error) {
        console.error("Failed to parse error response:", error);
        errorText = await response.text();
      }

      if (response.status == 401 && errorText.includes("Invalid credentials")) {
        errorText = "Некорректные учетные данные. Пожалуйста, зарегистрируйтесь или попробуйте еще раз.";
      } else if (response.status == 403 && errorText.includes("is deactivated")) {
        errorText = "Пользователь деактивирован. Пожалуйста, обратитесь к администратору.";
      } else if (response.status == 409 && (errorText.includes("already exists") || errorText.includes("с таким email уже существует"))) {
        errorText = "Пользователь с введённым адресом электронной почты уже существует.";
      } else {
        errorText = `Произошла ошибка при выполнении запроса: ${response.status} ${response.statusText} ${errorText}.`;
      }

      const error = new Error(`${errorText}`);
      if (errorData) {
        error.responseData = errorData;
      }
      
      throw error;
    }

    let jsonData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json') && response.status !== 204) {
      jsonData = await response.json();
    }

    if (options.callback && typeof options.callback === 'function') {
      options.callback(jsonData);
    }

    return jsonData;

  } catch(error) {
    console.error('Ошибка выполнения HTTP-запроса:', error);
    if (options.callback && typeof options.callback === 'function') {
      options.callback(null, error);
    } else {
      console.error(`Ошибка выполнения HTTP-запроса: ${error.message}`);
    }
    throw error;
  }
};
