import bgLogo from '../../img/cpt-anything-transparent.png';
import React, { useState } from 'react';
import Login from '../auth/Login.js';
import Register from '../auth/Register.js';
import Loading from '../layout/LoadingScreen.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../styles/LandingPage.css';

const LandingPage = () => {
  // Start on Register page by default
  const [showRegister, setShowRegister] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center vh-100 bg-dark"
      style={{
        backgroundImage: `url(${bgLogo})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'contain',
        maxWidth: '100vw',
        overflowX: 'hidden',
      }}
    >
      {loading && <Loading />}
      <div
        className="card p-4 shadow"
        style={{
          minWidth: 350,
          maxWidth: 400,
          background: 'rgba(20, 20, 20, 0.82)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(2px)',
          color: 'white',
        }}
      >
        <h2 className="text-center mb-4">{showRegister ? 'Register' : 'Login'}</h2>
        {showRegister ? (
          <>
            <Register
              onSwitchToLogin={() => setShowRegister(false)}
              setLoading={setLoading}
            />
            <div className="text-center mt-3">
              Already have an account?{' '}
              <button
                className="btn btn-link p-0"
                style={{ color: '#007bff', textDecoration: 'underline' }}
                onClick={() => setShowRegister(false)}
              >
                Login here
              </button>
            </div>
          </>
        ) : (
          <>
            <Login
              onSwitchToRegister={() => setShowRegister(true)}
              setLoading={setLoading}
            />
            <div className="text-center mt-3">
              Don't have an account?{' '}
              <button
                className="btn btn-link p-0"
                style={{ color: '#007bff', textDecoration: 'underline' }}
                onClick={() => setShowRegister(true)}
              >
                Register here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
