import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">👑</span>
          <span className="logo-text">Royal's Paradise</span>
        </Link>

        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span className={`hamburger ${isOpen ? 'open' : ''}`}></span>
        </button>

        <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link 
            to="/services" 
            className={`nav-link ${isActive('/services') ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Services
          </Link>

          <Link 
            to="/cart" 
            className="nav-link cart-link"
            onClick={() => setIsOpen(false)}
          >
            <span className="cart-icon">🛒</span>
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </Link>

          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => setIsOpen(false)}
            >
              <img 
                src={user?.avatar 
                  ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
                  : '/images/default-avatar.png'
                } 
                alt="avatar" 
                className="user-avatar"
              />
            </Link>
          ) : (
            <button className="login-btn" onClick={() => window.location.href = '/api/auth/discord'}>
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
