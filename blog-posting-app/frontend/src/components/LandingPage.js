import React, { useState } from 'react';
import Navbar from './Navbar.js'; // Import the Navbar component
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import '../styles/LandingPage.css'; // Import your custom styles


// Import any other necessary CSS files
const LandingPage = () => {
  const [username] = useState(localStorage.getItem('username'));

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    window.location.href = '/'; // Redirect to the homepage or login page
  };


  // Render the landing page
  return (
    <>
      {/* Navigation */}
      <Navbar user={{ username }} onLogout={handleLogout} />
      <div className="d-flex flex-column h-100">
        <main className="flex-shrink-0">

          {/* Header */}
          <section id="home">
            <header className="bg-dark py-5">
              <div className="container px-5">
                <div className="row gx-5 align-items-center justify-content-center">
                  <div className="col-lg-8 col-xl-7 col-xxl-6">
                    <div className="my-5 text-center text-xl-start">
                      <h1 className="display-5 fw-bolder text-white mb-2">
                        All your computer software and hardware needs, in one place.
                      </h1>
                      <p className="lead fw-normal text-white-50 mb-4">
                        Build your dream website, application, or personal computer! From software engineering and database management, to custom PC builds, we do it all!
                      </p>
                      <div className="d-grid gap-3 d-sm-flex justify-content-sm-center justify-content-xl-start">
                        <a className="btn custom-btn btn-lg px-4 me-sm-3" href="#contact">
                          Contact Directly for any Questions
                        </a>
                        <a
                          className="btn custom-btn btn-lg px-4 me-sm-3"
                          href="/posts"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Computer Anything Tech Blog
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="col-xl-5 col-xxl-6 d-none d-xl-block text-center">
                    <img className="img-fluid rounded-3 my-5" src="img/cpt_anything_box.jpg" alt="..." />
                  </div>
                </div>
              </div>
            </header>
          </section>

          {/* Features Section */}
          <section className="py-5" id="features">
            <div className="container px-5 my-5">
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
          <section class="py-5" id="contact">
              <div class="container px-5">
                  <div class="bg-dark rounded-3 py-5 px-4 px-md-5 mb-5">
                      <div class="text-center mb-5">
                          <h1 class="text-white">Contact Us</h1>
                          <p class="lead fw-normal text-muted mb-0">There's no time like the present to get started on a new project. We're easy to get in touch with and we'll help you figure it out. Just reach out and let's get started! If you can imagine it, we can build it!</p>
                      </div>
                  </div>
                  {/* Contact Cards */}
                  <div class="row gx-5 row-cols-2 row-cols-lg-4 py-5">
                      <div class="col">
                          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                              <i class="bi bi-envelope"></i></div>
                          <div class="h5">Email us</div>
                          <p class="text-muted mb-0">send an email to cpt.anything@gmail.com by filling out the form above!</p>
                      </div>
                      <div class="col">
                          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                              <i class="bi bi-discord"></i></div>
                          <div class="h5 mb-2">Chat with us</div>
                          <p class="text-muted mb-0">Join our <a href="https://discord.gg/QXs6p75pcS">Discord</a> channel and chat with us live.</p>
                      </div>
                      <div class="col">
                          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                              <i class="bi bi-facebook"></i></div>
                          <div class="h5">Ask the community</div>
                          <p class="text-muted mb-0">Follow us on <a href="https://www.facebook.com/people/Computer-Anything/61567372806344/">Facebook</a> and find out more about us.</p>
                      </div>
                      <div class="col">
                          <div class="feature bg-primary bg-gradient text-white rounded-3 mb-3">
                              <i class="bi bi-youtube"></i></div>
                          <div class="h5">Checkout our videos</div>
                          <p class="text-muted mb-0">Visit our <a href="https://www.youtube.com/@cpt_anything">YouTube channel</a> for coding tutorials and more!</p>
                      </div>
                  </div>
                  {/* Contact Form */}
                  <div class="row gx-5 justify-content-center">
                      <div class="col-lg-8">
                          <form method="post">
                              <div class="mb-3">
                                  <label for="name" class="form-label">Full Name</label>
                                  <input type="text" class="form-control" name="name" id="name" placeholder="Enter your name" required />
                              </div>
                              <div class="mb-3">
                                  <label for="email" class="form-label">Email Address</label>
                                  <input type="email" class="form-control" name="email" id="email" placeholder="Enter your email" required />
                              </div>
                              <div class="mb-3">
                                  <label for="attachment" class="form-label">Attachment</label>
                                  <input type="file" class="form-control" name="attachment" id="attachment" />
                              </div>
                              <div class="mb-3">
                                  <label for="message" class="form-label">Message</label>
                                  <textarea class="form-control" name="message" id="message" rows="5" placeholder="Enter your message" required></textarea>
                              </div>
                              <div class="g-recaptcha" data-sitekey="6LccOBYrAAAAABkg2TE_N7bccmpBXAFK4ZKZa3xg"></div>
                              <div class="d-grid">
                                  <button type="submit" class="btn btn-primary btn-lg">Send Message</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          </section>

          {/* Testimonial Section */}
          <section id="testimonials">
              <div class="py-5">
                  {/* Test 1 */}
                  <div class="container px-5 my-5">
                      <div class="row gx-5 justify-content-center">
                          <div class="col-lg-10 col-xl-7">
                              <div class="text-center">
                                  <div class="fs-4 mb-4 fst-italic">"Working with Computer Anything has saved me tons of development time Duncan is an excellent Software Engineer and has the ability to see your vision through with you while still getting things done in a surprisingly quick manner."</div>
                                  <div class="d-flex align-items-center justify-content-center">
                                      {/* <img class="rounded-circle me-3" src="https://dummyimage.com/40x40/ced4da/6c757d" alt="..." /> */}
                                      <div class="fw-bold">
                                          Tulla Contracting
                                          <span class="fw-bold text-primary mx-1">/</span>
                                          Personal Client of Computer Anything LLC
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="py-5">
                  {/* Test 2 */}
                  <div class="container px-5 my-5">
                      <div class="row gx-5 justify-content-center">
                          <div class="col-lg-10 col-xl-7">
                              <div class="text-center">
                                  <div class="fs-4 mb-4 fst-italic">"When my computer was broken Duncan came over about 10 minutes before I made my decision to buy a new one, he replaced some pieces inside my motherboard with extra computer parts he had. My computer was up and running in about 45 minutes."</div>
                                  <div class="d-flex align-items-center justify-content-center">
                                      {/* <img class="rounded-circle me-3" src="https://dummyimage.com/40x40/ced4da/6c757d" alt="..." /> */}
                                      <div class="fw-bold">
                                          Easy East
                                          <span class="fw-bold text-primary mx-1">/</span>
                                          Personal Client of Computer Anything LLC
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </section>

        </main>
      </div>
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 Computer Anything Tech Blog. All rights reserved.</p>
          <div className="footer-logo-container">
            <p>Created by:</p>
            <img
              src="/img/cpt_anything_box_thumb.jpg"
              alt="CPT Anything"
              className="footer-logo"
            />
          </div>
        </div>
      </footer>
    </>
  );
};

export default LandingPage;
