const axios = require('axios');

const PAYPAL_API = process.env.PAYPAL_MODE === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

let accessToken = null;
let tokenExpiry = null;

const getAccessToken = async () => {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const response = await axios.post(
      `${PAYPAL_API}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    accessToken = response.data.access_token;
    // Set expiry 5 minutes before actual expiry
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return accessToken;
  } catch (error) {
    console.error('PayPal Token Error:', error.response?.data || error.message);
    throw new Error('Failed to get PayPal access token');
  }
};

const createPayPalOrder = async ({ amount, currency, orderId }) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders`,
      {
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          custom_id: orderId,
          amount: {
            currency_code: currency,
            value: amount
          }
        }],
        application_context: {
          brand_name: "Royal's Paradise",
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.CLIENT_URL}/cart?success=true`,
          cancel_url: `${process.env.CLIENT_URL}/cart?canceled=true`
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('PayPal Order Creation Error:', error.response?.data || error.message);
    throw new Error('Failed to create PayPal order');
  }
};

const capturePayPalOrder = async (orderId) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.post(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('PayPal Capture Error:', error.response?.data || error.message);
    throw new Error('Failed to capture PayPal order');
  }
};

const verifyPayPalWebhook = async ({ authHeader, transmissionId, certUrl, timestamp, webhookEvent }) => {
  // Note: For production, implement full webhook signature verification
  // This is a simplified version
  try {
    // In production, you would verify the webhook signature using PayPal's SDK
    // For now, we trust the webhook if it has the correct structure
    return webhookEvent && webhookEvent.event_type && webhookEvent.resource;
  } catch (error) {
    console.error('PayPal Webhook Verification Error:', error);
    return false;
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalOrder,
  verifyPayPalWebhook,
  getAccessToken
};
