import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying...');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await API.get(`/verify-email/${token}`);
        setMessage(res.data.msg || 'Email verified successfully!');
        setTimeout(() => navigate('/login'), 2500);
      } catch (err) {
        setMessage(
          err.response?.data?.msg || 'Verification failed. Please try again or contact support.'
        );
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="auth-form">
      <h1>Email Verification</h1>
      <p>{message}</p>
      {message.includes('success') && (
        <button onClick={() => navigate('/login')}>Go to Login</button>
      )}
    </div>
  );
};

export default VerifyEmail;
