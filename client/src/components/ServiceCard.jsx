import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const ServiceCard = ({ service, isInCart }) => {
  const { addToCart, removeFromCart, currency } = useCart();

  const handleAddToCart = () => {
    addToCart(service);
  };

  const handleRemoveFromCart = () => {
    removeFromCart(service.id);
  };

  const price = currency === 'INR' ? service.priceINR : service.priceUSD;
  const originalPrice = currency === 'INR' ? service.originalPriceINR : service.originalPriceUSD;
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  return (
    <motion.div 
      className={`service-card glass-card ${isInCart ? 'in-cart' : ''}`}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="service-badge">
        {service.badge}
      </div>
      
      <div className="service-header">
        <h3 className="service-name">{service.name}</h3>
        <p className="service-game">{service.game}</p>
      </div>

      <div className="service-pricing">
        <div className="price-container">
          <span className="current-price">
            {currencySymbol}{price}
          </span>
          {originalPrice > price && (
            <>
              <span className="original-price">
                {currencySymbol}{originalPrice}
              </span>
              <span className="discount-badge">-{discount}%</span>
            </>
          )}
        </div>
      </div>

      <p className="service-description">{service.description}</p>

      <motion.button
        className={`service-button ${isInCart ? 'remove' : 'add'}`}
        onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
        whileTap={{ scale: 0.95 }}
      >
        {isInCart ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
            Remove
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
          </>
        )}
      </motion.button>
    </motion.div>
  );
};

export default ServiceCard;
