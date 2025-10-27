import axios from './axios';

/**
 * M-Pesa Payment API
 */
export const mpesaAPI = {
  /**
   * Initiate M-Pesa STK Push for order payment
   * @param {string} orderId - Order ID
   * @param {string} phoneNumber - Kenyan phone number (format: 0712345678 or 254712345678)
   * @returns {Promise}
   */
  initiateOrderPayment: (orderId, phoneNumber) =>
    axios.post('/payments/mpesa/initiate-order/', {
      order_id: orderId,
      phone_number: phoneNumber
    }),

  /**
   * Check payment status for an order
   * @param {string} orderId - Order ID
   * @returns {Promise}
   */
  checkOrderPaymentStatus: (orderId) =>
    axios.get(`/payments/mpesa/order-status/${orderId}/`),

  /**
   * Get user's M-Pesa transactions
   * @returns {Promise}
   */
  getMyTransactions: () =>
    axios.get('/payments/mpesa/my-transactions/'),

  /**
   * Mock payment for testing (development only)
   * @param {string} orderId - Order ID
   * @returns {Promise}
   */
  mockOrderPayment: (orderId) =>
    axios.post('/payments/mock-order/', {
      order_id: orderId
    }),
};
