import requests
import base64
from datetime import datetime
from django.conf import settings


class MpesaAPI:
    """
    M-Pesa Daraja API Integration for STK Push payments
    """

    def __init__(self):
        # Sandbox URLs (change to production later)
        self.base_url = getattr(settings, 'MPESA_ENVIRONMENT', 'sandbox')

        if self.base_url == 'sandbox':
            self.auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            self.stk_push_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            self.query_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', 'https://yourdomain.com/api/payments/callback/')
        else:
            self.auth_url = 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
            self.stk_push_url = 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            self.query_url = 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query'
            self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', 'https://yourdomain.com/api/payments/callback/')

        self.consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.business_shortcode = getattr(settings, 'MPESA_SHORTCODE', '')
        self.passkey = getattr(settings, 'MPESA_PASSKEY', '')

    def get_access_token(self):
        """Generate OAuth access token for API calls"""
        try:
            auth_string = f"{self.consumer_key}:{self.consumer_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_base64 = base64.b64encode(auth_bytes).decode('ascii')

            headers = {'Authorization': f'Basic {auth_base64}'}

            response = requests.get(self.auth_url, headers=headers)
            response.raise_for_status()

            result = response.json()
            return result.get('access_token')
        except Exception as e:
            print(f"Error getting access token: {str(e)}")
            return None

    def generate_password(self):
        """Generate password for STK Push"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.business_shortcode}{self.passkey}{timestamp}"
        password_bytes = password_string.encode('ascii')
        password_base64 = base64.b64encode(password_bytes).decode('ascii')

        return password_base64, timestamp

    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK Push to customer's phone"""
        print(f"[STK PUSH] Initiating for phone: {phone_number}, amount: {amount}")

        access_token = self.get_access_token()
        if not access_token:
            print("[STK PUSH ERROR] Failed to get access token")
            return {'success': False, 'message': 'Failed to get access token'}

        password, timestamp = self.generate_password()

        print(f"[STK PUSH] Using shortcode: {self.business_shortcode}")
        print(f"[STK PUSH] Timestamp: {timestamp}")
        print(f"[STK PUSH] Callback URL: {self.callback_url}")

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'BusinessShortCode': self.business_shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': self.business_shortcode,
            'PhoneNumber': phone_number,
            'CallBackURL': self.callback_url,
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }

        print(f"[STK PUSH] Payload: {payload}")

        try:
            print(f"[STK PUSH] Posting to: {self.stk_push_url}")
            response = requests.post(
                self.stk_push_url,
                json=payload,
                headers=headers,
                timeout=30
            )

            print(f"[STK PUSH] Response Status: {response.status_code}")
            print(f"[STK PUSH] Response Body: {response.text}")

            response.raise_for_status()

            result = response.json()

            if result.get('ResponseCode') == '0':
                print(f"[STK PUSH SUCCESS] CheckoutRequestID: {result.get('CheckoutRequestID')}")
                return {
                    'success': True,
                    'message': result.get('CustomerMessage', 'STK Push sent'),
                    'merchant_request_id': result.get('MerchantRequestID'),
                    'checkout_request_id': result.get('CheckoutRequestID')
                }
            else:
                error_msg = result.get('ResponseDescription', 'STK Push failed')
                print(f"[STK PUSH FAILED] {error_msg}")
                return {
                    'success': False,
                    'message': error_msg
                }

        except requests.exceptions.RequestException as e:
            print(f"[STK PUSH ERROR] Network error: {str(e)}")
            return {'success': False, 'message': f'Network error: {str(e)}'}
        except Exception as e:
            print(f"[STK PUSH ERROR] Unexpected error: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}

    def format_phone_number(self, phone):
        """Format phone number to 254XXXXXXXXX"""
        phone = str(phone).strip().replace(' ', '').replace('-', '')

        if phone.startswith('+'):
            phone = phone[1:]

        if phone.startswith('0'):
            phone = '254' + phone[1:]

        if len(phone) == 9 and phone[0] in ['7', '1']:
            phone = '254' + phone

        if len(phone) != 12 or not phone.startswith('254'):
            raise ValueError('Invalid Kenyan phone number format')

        return phone

    def query_stk_push_status(self, checkout_request_id):
        """Query the status of an STK Push transaction"""
        access_token = self.get_access_token()
        if not access_token:
            return {'success': False, 'message': 'Failed to get access token'}

        password, timestamp = self.generate_password()

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        payload = {
            'BusinessShortCode': self.business_shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }

        try:
            response = requests.post(
                self.query_url,
                json=payload,
                headers=headers,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            result_code = result.get('ResultCode')

            # Log the response for debugging
            print(f"M-Pesa Query Response: {result}")
            print(f"Result Code: {result_code} (type: {type(result_code)})")

            # Convert result_code to string for comparison
            result_code_str = str(result_code) if result_code is not None else None

            if result_code_str == '0':
                # Payment successful
                return {
                    'success': True,
                    'status': 'completed',
                    'message': result.get('ResultDesc', 'Payment successful')
                }
            elif result_code_str == '1032':
                # User cancelled
                return {
                    'success': False,
                    'status': 'cancelled',
                    'message': 'Payment cancelled by user'
                }
            elif result_code_str == '1037':
                # Timeout - user didn't enter PIN
                return {
                    'success': False,
                    'status': 'timeout',
                    'message': 'Payment request timed out'
                }
            elif result_code_str == '1':
                # Insufficient funds
                return {
                    'success': False,
                    'status': 'failed',
                    'message': 'Insufficient funds'
                }
            elif result_code_str == '1001':
                # Invalid credentials
                return {
                    'success': False,
                    'status': 'failed',
                    'message': 'Invalid M-Pesa credentials'
                }
            elif result_code_str is None or result_code_str == 'None' or result_code_str == '':
                # Still pending
                return {
                    'success': False,
                    'status': 'pending',
                    'message': 'Payment still pending'
                }
            else:
                # Other error - log it
                print(f"Unknown M-Pesa result code: {result_code_str}")
                return {
                    'success': False,
                    'status': 'failed',
                    'message': result.get('ResultDesc', 'Payment failed')
                }

        except requests.exceptions.RequestException as e:
            print(f"Query error: {str(e)}")
            return {'success': False, 'status': 'error', 'message': f'Network error: {str(e)}'}
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return {'success': False, 'status': 'error', 'message': f'Error: {str(e)}'}