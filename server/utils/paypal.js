const axios = require('axios');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

const baseUrl = PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(`${baseUrl}/v1/oauth2/token`, 
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

    return accessToken;
  } catch (error) {
    console.error('[PayPal] Token error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
};

const createPayPalOrder = async (amount, orderId) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(`${baseUrl}/v2/checkout/orders`, {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: orderId,
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        },
        custom_id: orderId
      }],
      application_context: {
        return_url: `${process.env.CLIENT_URL}/payment/success`,
        cancel_url: `${process.env.CLIENT_URL}/payment/cancel`
      }
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('[PayPal] Create order error:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal order');
  }
};

const capturePayPalOrder = async (orderId) => {
  try {
    const token = await getAccessToken();

    const response = await axios.post(
      `${baseUrl}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('[PayPal] Capture error:', error.response?.data || error.message);
    throw new Error('Failed to capture PayPal order');
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalOrder
};
