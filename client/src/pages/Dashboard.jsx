import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/user/orders');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      case 'refunded': return '#6b7280';
      default: return '#9b59b6';
    }
  };

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png?size=256`
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`;

  return (
    <motion.div 
      className="dashboard-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <section className="profile-section">
        <motion.div 
          className="profile-card glass-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="profile-header">
            <div className="profile-avatar-container">
              <img 
                src={avatarUrl} 
                alt={user?.username}
                className="profile-avatar"
              />
              <div className="avatar-ring"></div>
            </div>
            
            <div className="profile-info">
              <h1 className="profile-username">{user?.username}</h1>
              <p className="profile-discord-id">Discord ID: {user?.discordId}</p>
              <span className={`role-badge ${user?.role || 'user'}`}>
                {user?.role || 'User'}
              </span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-box">
              <span className="stat-number">{orders.filter(o => o.status === 'paid').length}</span>
              <span className="stat-text">Completed Orders</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {orders.reduce((acc, o) => acc + (o.status === 'paid' ? o.totalAmount : 0), 0)}
              </span>
              <span className="stat-text">Total Spent</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">
                {user?.isPremium ? '⭐' : 'Free'}
              </span>
              <span className="stat-text">Membership</span>
            </div>
          </div>

          <div className="profile-actions">
            <a 
              href={`https://discord.com/users/${user?.discordId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button secondary"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              View Discord Profile
            </a>
            <button onClick={handleLogout} className="action-button danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </motion.div>
      </section>

      <section className="orders-section">
        <h2 className="section-title">
          Purchase <span className="gradient-text">History</span>
        </h2>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders glass-card">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <h3>No orders yet</h3>
            <p>Your purchase history will appear here</p>
            <a href="/services" className="browse-btn">Browse Services</a>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                className="order-card glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="order-header">
                  <span className="order-id">#{order._id.slice(-8)}</span>
                  <span 
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="order-services">
                  {order.services.map((service, i) => (
                    <div key={i} className="service-item">
                      <span className="service-name">{service.name}</span>
                      <span className="service-game">{service.game}</span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <span className="order-amount">
                    {order.currency === 'INR' ? '₹' : '$'}{order.totalAmount}
                  </span>
                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default Dashboard;
