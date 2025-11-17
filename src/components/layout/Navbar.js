import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';
import './ProfileDropdown.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close Action Menu dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-menu-dropdown')) {
        setIsActionMenuOpen(false);
      }
    };
    if (isActionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isActionMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const renderNavLinks = () => {
    const links = [];
    if (user) {
      // Only add Profile link for logged-in users
      links.push(
        { to: '/profile', text: 'Profile', index: 1 }
      );
    } else {
      links.push(
        { to: '/login', text: 'Login', index: 1 },
        { to: '/register', text: 'Register', index: 2 }
      );
    }
    return links.map(({ to, text, index }) => (
      <li className="nav-item" key={to} style={{ '--item-index': index }}>
        <Link to={to} className="nav-links" onClick={closeMenu}>
          {text}
        </Link>
      </li>
    ));
  };

  const renderActionsDropdown = () => {
    if (!user) return null;
    let actions = [];
    if (user.role === 'admin') {
      actions = [
        { to: '/dashboard', text: 'Dashboard' },
        { to: '/jobs', text: 'Jobs' },
        { to: '/electricians', text: 'Electricians' },
        { to: '/materials', text: 'Materials' },
        { to: '/analytics', text: 'Analytics' },
        { to: '/invoices', text: 'Invoices' },
      ];
    } else {
      actions = [
        { to: '/dashboard', text: 'Dashboard' },
        { to: '/jobs', text: 'My Jobs' },
        { to: '/materials', text: 'Materials' },
        { to: '/invoices', text: 'Invoices' },
      ];
    }
    return (
      <li className="nav-item action-menu-dropdown">
        <button
          className="action-menu-btn"
          onClick={() => setIsActionMenuOpen((open) => !open)}
          type="button"
        >
          ACTIONS <span style={{marginLeft: '0.5em'}}>▼</span>
        </button>
        {isActionMenuOpen && (
          <div className="action-menu-content">
            {actions.map(({ to, text }) => (
              <Link
                key={to}
                to={to}
                className="action-menu-link"
                onClick={() => { setIsActionMenuOpen(false); setIsMenuOpen(false); }}
              >
                {text}
              </Link>
            ))}
          </div>
        )}
      </li>
    );
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          ElectroTrack
        </Link>

        <div className="menu-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </div>        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {renderNavLinks()}
          {renderActionsDropdown()}
          {user && (
            <>
              <li className="nav-item" style={{ '--item-index': user.role === 'admin' ? 7 : 5 }}>
                <button className="logout-button" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 