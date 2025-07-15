import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../layout/Modal.js';
import Login from '../auth/Login.js';
import Register from '../auth/Register.js';
import Loading from '../layout/LoadingScreen.js'; // Import the Loading component
import 'bootstrap/dist/css/bootstrap.min.css';
import API from '../../services/api';
import '../../styles/LandingPage.css';


const LandingPage = () => {
  const [isValidToken, setIsValidToken] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsValidToken(false);
        return;
      }

      try {
        await API.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsValidToken(true);
      } catch (error) {
        console.error('Invalid or expired token:', error.response?.data || error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsValidToken(false);
        navigate('/'); // Redirect to the landing page
      }
    };

    validateToken();
  }, [navigate]);


  const handleBlogClick = () => {
    if (isValidToken) {
      navigate('/posts'); // Navigate to /posts if logged in
    } else {
      setShowLoginModal(true); // Open the login modal if not logged in
    }
  };

  // Render the landing page
  return (
    <>
      {message && <div className="alert alert-success">{message}</div>}
      {loading && <Loading />} {/* Render Loading when loading is true */}

      <div className="d-flex flex-column h-100">

        {/* Header */}
        <section id="home">
          <header className="bg-dark py-5">
            <div className="container px-5">
              <div className="row gx-5 align-items-center justify-content-center">
                <div className="col-lg-8 col-xl-7 col-xxl-6">
                  <div className="my-2 text-center text-xl-start">
                    <h1 className="display-5 fw-bolder text-white mb-2">
                      All your computer software and hardware needs, in one place.
                    </h1>
                    <p className="lead fw-normal text-white-50 mb-4">
                      Build your dream website, application, or personal computer! From software engineering and database management, to custom PC builds, we do it all!
                    </p>
                    <div className="d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start">
                      <button
                        className="btn custom-btn btn-lg px-4 me-sm-3"
                        onClick={() => handleBlogClick()}
                      >
                        Computer Anything Tech Blog
                      </button>
                      <a className="btn custom-btn btn-lg px-4 me-sm-3" href="https://cheloniixd.github.io/" target="_blank" rel="noopener noreferrer">
                        About the Developer
                      </a>
                    </div>
                  </div>
                </div>
                <div className="col-xl-5 col-xxl-6 d-none d-xl-block text-center">
                  <img className="img-fluid rounded-3 my-3" src="/img/cpt_anything_box.jpg" alt="..." />
                </div>
              </div>
            </div>
          </header>
        </section>

        {/* Features Section */}
        <section className="py-2" id="features">
          <div className="container px-3 my-3">
            <div className="row gx-5">
              <div className="col-lg-4 mb-5 mb-lg-0">
                <h2 className="fw-bolder mb-0">A better way to start technology.</h2>
              </div>
              <div className="col-lg-8">
                <div className="row gx-5 row-cols-1 row-cols-md-2">
                  <div className="col mb-5 h-100">
                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                      <i className="bi bi-collection"></i>
                    </div>
                    <h2 className="h5">Software Development</h2>
                    <p className="mb-0">
                      Building, maintaining and updating fully dynamic sites and apps. Teams dedicated strictly to software.
                    </p>
                  </div>
                  <div className="col mb-5 h-100">
                    <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                      <i className="bi bi-building"></i>
                    </div>
                    <h2 className="h5">Custom Builds</h2>
                    <p className="mb-0">
                      Gaming, Developing, AI, or just fun personal projects. Computer Anything can be the one-stop shop to it all!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="pt-0 pb-5" id="contact"> {/* Adjusted padding */}
          <div className="container px-5">
            <div className="bg-dark rounded-3 py-5 px-4 px-md-5 mb-2">
              <div className="text-center mb-5">
                <h1 className="text-white">Contact</h1>
                <p className="contact-us-pgraph lead fw-normal mb-0">
                  There's no time like the present to get started on a new project. We're easy to get in touch with and we'll help you figure it out. Just reach out and let's get started! If you can imagine it, we can build it!
                </p>
              </div>
            </div>

            {/* Contact Cards */}
            <div className="row gx-5 row-cols-1 row-cols-md-4 justify-content-center py-2">
              <div className="col mb-4 mb-md-0 d-flex flex-column align-items-center">
                <a href="https://discord.gg/QXs6p75pcS" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                  <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                    <i className="bi bi-discord"></i>
                  </div>
                </a>
                <div className="h5 mb-2">Join our Discord</div>
              </div>
              <div className="col mb-4 mb-md-0 d-flex flex-column align-items-center">
                <a href="https://www.facebook.com/people/Computer-Anything/61567372806344/" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                  <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                    <i className="bi bi-facebook"></i>
                  </div>
                </a>
                <div className="h5">Ask the community</div>
              </div>
              <div className="col mb-4 mb-md-0 d-flex flex-column align-items-center">
                <a href="tel:+16313586777" className="text-decoration-none">
                  <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                    <i className="bi bi-telephone"></i>
                  </div>
                </a>
                <div className="h5">Call Us</div>
              </div>
              <div className="col mb-4 mb-md-0 d-flex flex-column align-items-center">
                <a href="mailto:cpt.anything@gmail.com" className="text-decoration-none">
                  <div className="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                    <i className="bi bi-envelope"></i>
                  </div>
                </a>
                <div className="h5">Email Us</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section id="testimonials">
          <div className="py-5">
            <div className="container mb-5">
              <h2 className="text-center mb-4">Checkout some of the great companies, we've helped build websites for</h2>
              <div className="text-center">
                <a href="https://tulla-contracting-render.onrender.com/" target="_blank" rel="noopener noreferrer">
                  <img src="/img/logo_tulla.png" className="d-block mx-auto rounded" alt="Tulla Contracting" style={{maxHeight: '180px'}} />
                </a>
                <div className="fs-4 mb-4 fst-italic mt-4">
                  "Working with Computer Anything LLC was an
                  absolute game-changer for Our company. From the very first consultation, their team
                  demonstrated an impressive depth of knowledge, creativity, and professionalism that
                  immediately put us at ease. They took the time to understand our brand, our values,
                  and the unique challenges of the contracting industry, translating all of that into a
                  stunning, user-friendly website that exceeded every expectation. The design is clean,
                  modern, and highly functional, exactly what we needed to showcase our work and attract
                  new clients. Duncan provided strategic insights that helped us
                  improve our digital presence across the board. Whether it was content planning,
                  analytics, or ongoing support, Computer Anything LLC delivered with clarity and
                  purpose. We couldn't be happier with the results. If you're looking for a website
                  partner who’s invested in your success and knows how to deliver real value, look no
                  further than Computer Anything LLC. Highly recommended!"
                </div>
                <div className="d-flex align-items-center justify-content-center">
                  {/* <img className="rounded-circle me-3" src="https://dummyimage.com/40x40/ced4da/6c757d" alt="..." /> */}
                  <div className="fw-bold">
                    <a href="https://tulla-contracting-render.onrender.com/" target="_blank" rel="noopener noreferrer" className="">
                      Tulla Contracting
                    </a>
                    <span className="fw-bold text-primary mx-1">/</span>
                    Personal Client of Computer Anything LLC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Login/Reg Modals */}
        {/* Login Modal */}
        <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
          <Login
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
            setLoading={setLoading} // Pass setLoading function
          />
        </Modal>
        {/* Register Modal */}
        <Modal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)}>
          <Register
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
            setLoading={setLoading} // Pass setLoading function
          />
        </Modal>

      </div>
    </>
  );
};

export default LandingPage;
