import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import './ServiceCard.css';

const ServiceCard = ({ service, game, onAddToCart }) => {
  const { currency, addToCart, cart } = useCart();
  
  const isInCart = cart.some(
    item => item.id === service.id && item.game === game
  );

  const price = currency === 'INR' ? service.priceInr : service.priceUsd;
  const originalPrice = currency === 'INR' ? service.originalPriceInr : service.originalPriceUsd;
  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const handleAddToCart = () => {
    if (!isInCart) {
      addToCart({
        id: service.id,
        name: service.name,
        game,
        priceInr: service.priceInr,
        priceUsd: service.priceUsd,
        originalPriceInr: service.originalPriceInr,
        originalPriceUsd: service.originalPriceUsd,
        description: service.description,
        isMonthly: service.isMonthly
      });
    }
  };

  return (
    <motion.div 
      className={`service-card ${isInCart ? 'in-cart' : ''}`}
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {service.isMonthly && (
        <div className="monthly-badge">
          <span>⭐ Monthly</span>
        </div>
      )}

      <div className="service-header">
        <h3 className="service-name">{service.name}</h3>
        <p className="service-description">{service.description}</p>
      </div>

      <div className="service-pricing">
        <div className="price-current">{currencySymbol}{price}</div>
        {originalPrice > price && (
          <div className="price-original">{currencySymbol}{originalPrice}</div>
        )}
        {originalPrice > price && (
          <div className="discount-badge">
            {Math.round((1 - price / originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      <motion.button 
        className={`add-to-cart-btn ${isInCart ? 'in-cart' : ''}`}
        onClick={handleAddToCart}
        whileTap={{ scale: 0.95 }}
        disabled={isInCart}
      >
        {isInCart ? 'Added ✓' : 'Add to Cart'}
      </motion.button>
    </motion.div>
  );
};

export default ServiceCard;
