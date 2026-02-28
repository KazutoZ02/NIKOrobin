import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Welcome.css';

const Welcome = () => {
  const { login, isAuthenticated } = useAuth();

  const stats = [
    { value: '4+', label: 'Games' },
    { value: '24/7', label: 'Support' },
    { value: '100%', label: 'Secure' },
    { value: 'VIP', label: 'Membership' }
  ];

  return (
    <motion.div 
      className="welcome-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="hero-badge">
            Premium Gaming & Digital Services
          </div>
          
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Royal's Paradise</span>
          </h1>
          
          <p className="hero-subtitle">
            Your premier destination for top-tier gaming services, 
            account boosting, and exclusive digital content. 
            Experience gaming like royalty.
          </p>

          <div className="hero-buttons">
            <Link to="/services" className="hero-btn primary">
              <span>Explore Services</span>
              <span className="btn-icon">→</span>
            </Link>
            
            <Link to="/about" className="hero-btn secondary">
              <span>Meet the Team</span>
            </Link>

            {!isAuthenticated && (
              <motion.button 
                className="hero-btn discord-login"
                onClick={login}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="discord-icon">🎮</span>
                <span>Login with Discord</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div 
          className="hero-stats"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="stat-item"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>
    </motion.div>
  );
};

export default Welcome;
