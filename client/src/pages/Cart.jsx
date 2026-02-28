import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Cart = () => {
  const { cart, removeFromCart, clearCart, currency, getTotal, getCartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const currencySymbol = currency === 'INR' ? '₹' : '$';

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      window.location.href = '/api/auth/discord';
      return;
    }

    if (cart.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Create order in backend
      const orderResponse = await api.post('/orders', {
        services: getCartItems(),
        totalAmount: getTotal(),
        currency,
        paymentMethod
      });

      const orderId = orderResponse.data.order._id;

      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const razorpayResponse = await api.post('/payments/razorpay/create', {
          orderId,
          amount: getTotal(),
          currency
        });

        const { order: razorpayOrder, keyId } = razorpayResponse.data;

        // Initialize Razorpay
        const options = {
          key: keyId,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "Royal's Paradise",
          description: 'Gaming Services',
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              const verifyResponse = await api.post('/payments/razorpay/verify', {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId
              });

              if (verifyResponse.data.success) {
                setSuccess(true);
                clearCart();
              }
            } catch (err) {
              setError('Payment verification failed');
            }
          },
          prefill: {
            name: 'Customer',
            email: 'customer@example.com'
          },
          theme: {
            color: '#9b59b6'
          }
        };

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay(options);
          rzp.open();
        };
      } else {
        // PayPal checkout
        const paypalResponse = await api.post('/payments/paypal/create', {
          orderId,
          amount: getTotal(),
          currency
        });

        const approvalUrl = paypalResponse.data.order.links.find(
          link => link.rel === 'approve'
        );

        if (approvalUrl) {
          window.location.href = approvalUrl.href;
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle PayPal redirect
  const handlePayPalSuccess = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const orderId = urlParams.get('orderId');

    if (token && orderId) {
      setLoading(true);
      try {
        await api.post('/payments/paypal/capture', {
          paypalOrderId: token,
          orderId
        });
        setSuccess(true);
        clearCart();
      } catch (err) {
        setError('Payment capture failed');
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <motion.div 
        className="cart-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="success-container">
          <motion.div 
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            ✓
          </motion.div>
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase. Your order is being processed.</p>
          <Link to="/dashboard" className="success-button">
            View Dashboard
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="cart-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <section className="cart-header">
        <h1 className="page-title">
          Your <span className="gradient-text">Cart</span>
        </h1>
        {cart.length > 0 && (
          <button className="clear-cart-btn" onClick={clearCart}>
            Clear Cart
          </button>
        )}
      </section>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>Your cart is empty</h2>
          <p>Add some services to get started!</p>
          <Link to="/services" className="browse-services-btn">
            Browse Services
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <AnimatePresence>
              {cart.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="cart-item glass-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="item-info">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-game">{item.game}</p>
                  </div>
                  
                  <div className="item-price">
                    {currencySymbol}{currency === 'INR' ? item.priceINR : item.priceUSD}
                  </div>
                  
                  <button 
                    className="remove-item-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="cart-summary glass-card">
            <h3>Order Summary</h3>
            
            <div className="summary-items">
              {cart.map(item => (
                <div key={item.id} className="summary-item">
                  <span>{item.name}</span>
                  <span>{currencySymbol}{currency === 'INR' ? item.priceINR : item.priceUSD}</span>
                </div>
              ))}
            </div>
            
            <div className="summary-total">
              <span>Total</span>
              <span className="total-amount">{currencySymbol}{getTotal()}</span>
            </div>

            <div className="payment-methods">
              <h4>Payment Method</h4>
              <div className="payment-options">
                <button
                  className={`payment-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                  disabled={currency === 'USD'}
                >
                  <span className="payment-icon">📱</span>
                  <span>Razorpay</span>
                  {currency === 'USD' && <span className="payment-badge">INR Only</span>}
                </button>
                <button
                  className={`payment-option ${paymentMethod === 'paypal' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('paypal')}
                >
                  <span className="payment-icon">🅿️</span>
                  <span>PayPal</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <motion.button
              className="checkout-button"
              onClick={handleCheckout}
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : isAuthenticated ? (
                `Pay ${currencySymbol}${getTotal()}`
              ) : (
                'Login to Checkout'
              )}
            </motion.button>

            {!isAuthenticated && (
              <p className="login-hint">Login with Discord to complete your purchase</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Cart;
