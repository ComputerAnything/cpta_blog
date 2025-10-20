import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials, setGuest, setLoading } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import '../../styles/Auth.css';


const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    setShowResend(false);
    setResendStatus('');
    try {
      const response = await API.post('/login', { identifier, password });
      dispatch(setCredentials({
        user: {
          username: response.data.username,
          userId: response.data.user_id,
        },
        token: response.data.access_token,
      }));
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('userId', response.data.user_id);
      localStorage.removeItem('guest');
      setMessage('');
  navigate('/posts');
    } catch (error) {
      const errMsg = error.response?.data?.msg || 'Login failed. Please check your credentials.';
      setMessage(errMsg);
      if (errMsg.toLowerCase().includes('verify')) {
        setShowResend(true);
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGuest = () => {
    dispatch(setGuest());
    localStorage.setItem('guest', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setMessage('');
  navigate('/posts');
  };

  const handleResendVerification = async () => {
    setResendStatus('');
    dispatch(setLoading(true));
    try {
      await API.post('/resend-verification', { identifier });
      setResendStatus('Verification email sent! Please check your inbox.');
    } catch (error) {
      setResendStatus(error.response?.data?.msg || 'Failed to resend verification email.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <form className="auth-form" onSubmit={handleLogin}>
      <input
        type="text"
        placeholder="Username or Email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <div className="input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="button"
          className="toggle-password-btn"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? '👁️' : '🙈'}
        </button>
      </div>
      <button type="submit" className="auth-btn">Login</button>
      <button
        type="button"
        className="guest-btn"
        onClick={handleGuest}
      >
        Continue as Guest
      </button>
      {message && (
        <div>
          <p className="error-message">
            {message}
            {showResend && (
              <>
                <br />
                <button
                  type="button"
                  className="auth-btn"
                  style={{ background: '#ffc107', color: '#222', margin: '8px 0 0 0' }}
                  onClick={handleResendVerification}
                  disabled={!identifier}
                >
                  Resend Verification Email
                </button>
              </>
            )}
          </p>
          {showResend && resendStatus && (
            <p className={resendStatus.includes('sent') ? 'success-message' : 'error-message'}>
              {resendStatus}
            </p>
          )}
        </div>
      )}
    </form>
  );
};

export default Login;
