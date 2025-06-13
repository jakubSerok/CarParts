import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../context/ContextProvider';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { setToken, url } = useContext(Context);
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Resetowanie błędu przed próbą logowania
    try {
      const response = await axios.post(`${url}/api/user/login`, {
        username,
        password
      });
      setToken(response.data.token);
      
      // Get user ID from JWT token
      const tokenPayload = JSON.parse(atob(response.data.token.split('.')[1]));
      const userId = tokenPayload._id;
      
      // Store in both contexts
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userId', userId);
      
      // Update AuthContext
      authLogin(response.data.token, response.data.role, userId);

      // Przekierowanie na podstawie roli
      if (response.data.role === 'admin') {
        navigate('/admin-panel');
      } else {
        navigate('/user-panel');
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Logowanie nie powiodło się. Spróbuj ponownie.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96 animate-fadeIn">
        <h2 className="text-2xl font-bold text-center mb-6">Logowanie</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700">Login:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(''); // Resetowanie błędu przy zmianie
              }}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Hasło:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // Resetowanie błędu przy zmianie
              }}
              required
              className="mt-1 block w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition duration-200"
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;