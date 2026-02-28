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
  const [cart, setCart] = useState([]);
  const [currency, setCurrency] = useState('INR');

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('royals-cart');
    const savedCurrency = localStorage.getItem('royals-currency');
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
    
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('royals-cart', JSON.stringify(cart));
    localStorage.setItem('royals-currency', currency);
  }, [cart, currency]);

  const addToCart = (service) => {
    const exists = cart.find(item => 
      item.id === service.id && item.game === service.game
    );
    
    if (!exists) {
      setCart([...cart, { ...service, quantity: 1 }]);
    }
  };

  const removeFromCart = (serviceId, game) => {
    setCart(cart.filter(item => !(item.id === serviceId && item.game === game)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const price = currency === 'INR' ? item.priceInr : item.priceUsd;
      return total + price;
    }, 0);
  };

  const getOriginalTotal = () => {
    return cart.reduce((total, item) => {
      const price = currency === 'INR' ? item.originalPriceInr : item.originalPriceUsd;
      return total + price;
    }, 0);
  };

  const getDiscount = () => {
    return getOriginalTotal() - getTotal();
  };

  const value = {
    cart,
    currency,
    setCurrency,
    addToCart,
    removeFromCart,
    clearCart,
    getTotal,
    getOriginalTotal,
    getDiscount,
    itemCount: cart.length
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [currency, setCurrency] = useState('INR');

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('royals-cart');
    const savedCurrency = localStorage.getItem('royals-currency');
    
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart:', e);
      }
    }
    
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('royals-cart', JSON.stringify(cart));
    localStorage.setItem('royals-currency', currency);
  }, [cart, currency]);

  const addToCart = (service) => {
    const exists = cart.find(item => 
      item.id === service.id && item.game === service.game
    );
    
    if (!exists) {
      setCart([...cart, { ...service, quantity: 1 }]);
    }
  };

  const removeFromCart = (serviceId, game) => {
    setCart(cart.filter(item => !(item.id === serviceId && item.game === game)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => {
      const price = currency === 'INR' ? item.priceInr : item.priceUsd;
      return total + price;
    }, 0);
  };

  const getOriginalTotal = () => {
    return cart.reduce((total, item) => {
      const price = currency === 'INR' ? item.originalPriceInr : item.originalPriceUsd;
      return total + price;
    }, 0);
  };

  const getDiscount = () => {
    return getOriginalTotal() - getTotal();
  };

  const value = {
    cart,
    currency,
    setCurrency,
    addToCart,
    removeFromCart,
    clearCart,
    getTotal,
    getOriginalTotal,
    getDiscount,
    itemCount: cart.length
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
