import React from 'react';
import '../../styles/Layout.css'


const Footer = () => (
  <footer className="footer-info-bar w-100">
    <div className="container py-2">
      <div className="footer-content d-flex flex-wrap flex-row align-items-center justify-content-center gap-2">
        <span className="small m-0 text-center">
          Copyright © 2025 Computer Anything Tech Blog - All Rights Reserved
        </span>
        {/* Separator is hidden on small screens for responsive design */}
        <span className="mx-1 d-none d-sm-inline">&middot;</span>
        <span className="footer-powered-by">
          <a
            className="small"
            href="https://computeranything.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#fff" }}
          >
            Powered by Computer Anything LLC
          </a>
          <a
            href="https://computeranything.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="footer-logo"
              src="/img/cpt-anything-transparent-thumb.png"
              alt="Computer Anything Logo"
              height={40}
              style={{ verticalAlign: "middle", display: "inline-block" }}
            />
          </a>
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
