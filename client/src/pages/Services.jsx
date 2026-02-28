import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ServiceCard from '../components/ServiceCard';
import { useCart } from '../context/CartContext';

const allServices = [
  // Genshin Impact Services
  {
    id: 'genshin-nation',
    name: 'Per Nation Exploration',
    game: 'Genshin Impact',
    priceINR: 1800,
    priceUSD: 21,
    originalPriceINR: 2000,
    originalPriceUSD: 24,
    description: 'Complete exploration for a single nation including all chests, puzzles, and secrets.',
    badge: 'Popular',
    category: 'genshin'
  },
  {
    id: 'genshin-archon',
    name: 'Archon Quest',
    game: 'Genshin Impact',
    priceINR: 360,
    priceUSD: 4.5,
    originalPriceINR: 400,
    originalPriceUSD: 5,
    description: 'Complete archon questline with all cutscenes and rewards.',
    badge: null,
    category: 'genshin'
  },
  {
    id: 'genshin-monthly',
    name: 'Monthly Membership',
    game: 'Genshin Impact',
    priceINR: 500,
    priceUSD: 6,
    originalPriceINR: null,
    originalPriceUSD: null,
    description: 'Monthly subscription including daily farming, resin management, and event completion.',
    badge: 'Monthly',
    category: 'genshin'
  },
  
  // Honkai Star Rail Services
  {
    id: 'hsr-exploration',
    name: 'Exploration',
    game: 'Honkai Star Rail',
    priceINR: 2000,
    priceUSD: 24,
    originalPriceINR: 2500,
    originalPriceUSD: 30,
    description: 'Full exploration of one world including all chests, treasures, and achievements.',
    badge: 'Popular',
    category: 'hsr'
  },
  {
    id: 'hsr-monthly',
    name: 'Monthly Membership',
    game: 'Honkai Star Rail',
    priceINR: 500,
    priceUSD: 6,
    originalPriceINR: null,
    originalPriceUSD: null,
    description: 'Daily trailblaze power management, calyx farming, and event completion.',
    badge: 'Monthly',
    category: 'hsr'
  },
  
  // Maintenance Services
  {
    id: 'maintenance-basic',
    name: 'Basic Account Maintenance',
    game: 'Maintenance',
    priceINR: 300,
    priceUSD: 4,
    originalPriceINR: 350,
    originalPriceUSD: 5,
    description: 'Daily login, daily missions, and basic resource management.',
    badge: null,
    category: 'maintenance'
  },
  {
    id: 'maintenance-premium',
    name: 'Premium Account Care',
    game: 'Maintenance',
    priceINR: 800,
    priceUSD: 10,
    originalPriceINR: 1000,
    originalPriceUSD: 12,
    description: 'Complete account management including all dailies, weeklies, and events.',
    badge: 'Premium',
    category: 'maintenance'
  }
];

const filterTabs = [
  { id: 'all', label: 'All Services' },
  { id: 'genshin', label: 'Genshin Impact' },
  { id: 'hsr', label: 'Honkai Star Rail' },
  { id: 'maintenance', label: 'Maintenance' }
];

const Services = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const { cart, currency, setCurrency } = useCart();

  const filteredServices = useMemo(() => {
    if (activeFilter === 'all') return allServices;
    return allServices.filter(service => service.category === activeFilter);
  }, [activeFilter]);

  const isInCart = (serviceId) => {
    return cart.some(item => item.id === serviceId);
  };

  return (
    <motion.div 
      className="services-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <section className="services-header">
        <motion.h1 
          className="page-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          Our <span className="gradient-text">Services</span>
        </motion.h1>
        
        <motion.p 
          className="page-subtitle"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Premium gaming services tailored to your needs
        </motion.p>

        <motion.div 
          className="currency-toggle"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <button
            className={`currency-btn ${currency === 'INR' ? 'active' : ''}`}
            onClick={() => setCurrency('INR')}
          >
            INR (₹)
          </button>
          <button
            className={`currency-btn ${currency === 'USD' ? 'active' : ''}`}
            onClick={() => setCurrency('USD')}
          >
            USD ($)
          </button>
        </motion.div>
      </section>

      <section className="filter-section">
        <motion.div 
          className="filter-tabs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>
      </section>

      <section className="services-grid">
        <AnimatePresence mode="popLayout">
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <ServiceCard 
                service={service}
                isInCart={isInCart(service.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {filteredServices.length === 0 && (
        <div className="no-services">
          <p>No services found in this category.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Services;
