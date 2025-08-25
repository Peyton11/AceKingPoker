import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import '../styles/custom-theme.css';
import AceKingLogo from '../AceKingLogoNoWords.png';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NavigationBar = ({ userName, userTotalChips }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = `${BACKEND_URL}/auth/logout`;
  };

  const handleLogoClick = () => {
    navigate('/home');
  };

  return (
      <Navbar expand="lg" className="custom-navbar px-4 py-3">
        <Container fluid className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-4">
            <div className="d-flex align-items-center gap-2">
              <img
                  src={AceKingLogo}
                  alt="Logo"
                  style={{ width: 60, height: 60, objectFit: 'contain' }}
              />
              <Navbar.Brand
                  onClick={handleLogoClick}
                  style={{ cursor: 'pointer' }}
                  className="custom-navbar-brand fs-3 fw-bold text-light mb-0"
              >
                Ace King Poker
              </Navbar.Brand>
            </div>

            <div className="d-flex flex-column text-light">
              <div><strong>Name:</strong> {userName || "Loading..."}</div>
              <div><strong>Credits:</strong> {userTotalChips ?? 0}</div>
            </div>
          </div>

          <Nav className="ms-auto d-flex align-items-center gap-3">
            <button className="styled-action-button" onClick={() => navigate('/terminology')}>
              Poker Terminology
            </button>
            <button className="styled-action-button" onClick={() => navigate('/how-to-play')}>
              How to Play
            </button>
            <button className="styled-action-button" onClick={() => navigate('/stats')}>
              Stats Page
            </button>
            <button className="styled-action-button" onClick={handleLogout}>
              Logout
            </button>
          </Nav>
        </Container>
      </Navbar>
  );
};

export default NavigationBar;
