import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('royal_cart');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    localStorage.setItem('royal_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === service.id);
      if (existing) {
        return prev;
      }
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (serviceId) => {
    setCart(prev => prev.filter(item => item.id !== serviceId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const price = currency === 'INR' ? item.priceINR : item.priceUSD;
      return total + price;
    }, 0);
  };

  const getCartItems = () => {
    return cart.map(item => ({
      serviceId: item.id,
      name: item.name,
      game: item.game,
      price: currency === 'INR' ? item.priceINR : item.priceUSD,
      currency,
      quantity: 1
    }));
  };

  const value = {
    cart,
    currency,
    setCurrency,
    addToCart,
    removeFromCart,
    clearCart,
    getTotal,
    getCartItems,
    cartCount: cart.length
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
