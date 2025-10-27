# M-Pesa Payment Integration Guide

This guide explains how to integrate M-Pesa payments into your bidding marketplace application.

## Overview

The M-Pesa integration allows users to pay for their orders using Safaricom's M-Pesa mobile money service via STK Push.

## Backend Setup

### 1. Configuration

M-Pesa credentials are already configured in `.env`:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=DTNHLt6T1VbXtxkxqsxJUy4JFsXTGBdAGG6SXEe8p61jbbye
MPESA_CONSUMER_SECRET=jRKFkbphkeQPDhhHUAQw2OiScaTuX2Aw1GKxcce18xDpRSkpCRGJKMyPhsw4VFvj
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

###  2. Database Model

The `MpesaTransaction` model tracks all M-Pesa payments:

- User and Order information
- Phone number and amount
- M-Pesa checkout request ID
- Payment status (pending, completed, failed, cancelled)
- M-Pesa receipt number
- Raw callback data for debugging

### 3. API Endpoints

#### Initiate Payment
```http
POST /api/payments/mpesa/initiate-order/
Content-Type: application/json
Authorization: Bearer <token>

{
  "order_id": "uuid-here",
  "phone_number": "0712345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "STK Push sent. Check your phone to complete payment.",
  "checkout_request_id": "ws_CO_...",
  "transaction_id": "uuid"
}
```

#### Check Payment Status
```http
GET /api/payments/mpesa/order-status/<order_id>/
Authorization: Bearer <token>
```

**Response:**
```json
{
  "payment_status": "completed",
  "order_status": "paid",
  "total_price": 1500.00,
  "mpesa_receipt": "QGH7XYZ123",
  "transaction_date": "2025-10-27T12:30:00Z",
  "message": "Payment completed successfully!"
}
```

#### Get My Transactions
```http
GET /api/payments/mpesa/my-transactions/
Authorization: Bearer <token>
```

#### M-Pesa Callback (No auth required)
```http
POST /api/payments/mpesa/callback/
```

This endpoint receives payment confirmations from Safaricom.

## Frontend Integration

### 1. Import the Component

```jsx
import MpesaPayment from '../components/payment/MpesaPayment';
```

### 2. Use in Your Checkout/Order Page

```jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MpesaPayment from '../components/payment/MpesaPayment';

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showPayment, setShowPayment] = useState(false);

  // Your order data
  const order = {
    id: orderId,
    total_price: 1500.00,
    // ... other order details
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('Payment successful!', paymentData);
    // Redirect to success page or show success message
    navigate(`/orders/${orderId}/success`);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
        {/* Display order items here */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>KSH {order.total_price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {showPayment ? (
        <MpesaPayment
          orderId={order.id}
          amount={order.total_price}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      ) : (
        <button
          onClick={() => setShowPayment(true)}
          className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition"
        >
          Pay with M-Pesa
        </button>
      )}
    </div>
  );
}
```

### 3. Component Props

The `MpesaPayment` component accepts the following props:

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `orderId` | string (UUID) | Yes | The order ID to pay for |
| `amount` | number | Yes | Total amount to pay |
| `onSuccess` | function | No | Callback when payment succeeds. Receives payment data |
| `onCancel` | function | No | Callback when user cancels payment |

### 4. Payment Flow

1. **User enters phone number**: Format 0712345678 or 254712345678
2. **STK Push initiated**: Request sent to M-Pesa API
3. **User receives prompt**: M-Pesa popup appears on user's phone
4. **User enters PIN**: Confirms payment on phone
5. **Callback received**: M-Pesa sends payment confirmation
6. **Status updated**: Order marked as paid, stock reduced
7. **Success shown**: User sees success message

## Testing

### Sandbox Test Credentials

For testing in sandbox environment:

**Test Phone Numbers:**
- 254708374149
- 254712345678

**Test PIN:** 1234 (or any 4 digits in sandbox)

### Mock Payment (Development Only)

For faster testing without M-Pesa:

```jsx
import { mpesaAPI } from '../api/endpoints';

// Mock instant payment
const mockPay = async () => {
  try {
    const response = await mpesaAPI.mockOrderPayment(orderId);
    console.log('Mock payment successful', response.data);
  } catch (error) {
    console.error('Mock payment failed', error);
  }
};
```

## Production Deployment

### 1. Update Environment Variables

On production server (`/var/www/bidding-marketplace/.env`):

```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=<your_production_key>
MPESA_CONSUMER_SECRET=<your_production_secret>
MPESA_SHORTCODE=<your_paybill>
MPESA_PASSKEY=<your_production_passkey>
```

### 2. Update Callback URL

In `settings.py`, the callback URL automatically changes to:
```
https://bidsoko.com/api/payments/mpesa/callback/
```

### 3. Register Callback URL

On Daraja Portal:
1. Go to your app
2. Register validation URL: `https://bidsoko.com/api/payments/mpesa/callback/`
3. Save and test

### 4. SSL Certificate

M-Pesa requires HTTPS. Your site already has SSL configured with Let's Encrypt.

## Troubleshooting

### Common Issues

**1. "Invalid phone number format"**
- Ensure phone number is Kenyan (starts with 254 or 07)
- Remove spaces and special characters

**2. "Failed to get access token"**
- Check MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET
- Verify credentials are for correct environment (sandbox/production)

**3. "STK Push timeout"**
- User may have cancelled on phone
- Phone may be offline
- User may have insufficient balance

**4. Callback not received**
- Check callback URL is registered on Daraja
- Ensure callback endpoint is accessible (no firewall blocking)
- Check Django logs: `tail -f /var/log/bidding-django.log`

### Debug Logs

M-Pesa callbacks are logged to console. Check Django logs:

```bash
# Local
python manage.py runserver

# Production
tail -f /var/log/bidding-django.log
```

## Phone Number Formats

The system accepts multiple formats and automatically converts them:

- `0712345678` → `254712345678` ✅
- `254712345678` → `254712345678` ✅
- `+254712345678` → `254712345678` ✅
- `712345678` → `254712345678` ✅

## Security Notes

1. **Never commit credentials** - Always use environment variables
2. **Use HTTPS in production** - M-Pesa requires secure callbacks
3. **Validate callback data** - Verify checkout_request_id matches
4. **Log all transactions** - Keep raw_callback_data for audit

## API Response Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Insufficient Balance |
| 1032 | Request cancelled by user |
| 1037 | Timeout (user didn't respond) |
| 2001 | Wrong PIN |

## Support

For M-Pesa API issues:
- Daraja Portal: https://developer.safaricom.co.ke
- Support Email: apisupport@safaricom.co.ke

For application issues:
- Check application logs
- Review transaction history in admin panel
- Test with mock payment first
