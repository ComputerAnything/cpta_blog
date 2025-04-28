import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoading } from '../redux/authSlice';
import API from '../services/api';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      dispatch(setLoading(true));
      try {
        await API.post('/verify-email', { token });
        setMessage('Your email has been verified! You can now log in.');
        setSuccess(true);
      } catch (error) {
        setMessage(error.response?.data?.msg || 'Verification failed. The link may be invalid or expired.');
        setSuccess(false);
      } finally {
        dispatch(setLoading(false));
      }
    };
    verify();
  }, [token, dispatch]);

  return (
    <div className="auth-form">
      <h1>Email Verification</h1>
      <p className={success ? 'success-message' : 'error-message'}>{message}</p>
      <button
        className="auth-btn"
        onClick={() => navigate('/')}
        style={{ marginTop: '1em' }}
      >
        Go to Home
      </button>
    </div>
  );
};

export default VerifyEmail;
