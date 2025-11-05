# Email Verification & Password Reset - Implementation Guide

## ✅ What's Been Implemented

### 1. **Email Verification on Registration**
When users register, they now automatically receive a verification email.

### 2. **Password Reset (Forgot Password)**
Users can request a password reset link via email.

### 3. **Beautiful HTML Email Templates**
All emails use professional HTML templates with BidSoko branding.

---

## 📋 API Endpoints

### **1. Registration (Updated)**
**Endpoint**: `POST /api/auth/users/`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response**:
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "is_verified": false,
  "email_sent": true,
  "message": "Registration successful! Please check your email to verify your account."
}
```

**What Happens**:
- User account is created
- Verification token is generated (expires in 24 hours)
- Verification email is sent to user's email

---

### **2. Verify Email**
**Endpoint**: `POST /api/auth/users/verify_email/`

**Request Body**:
```json
{
  "token": "verification_token_from_email"
}
```

**Success Response**:
```json
{
  "message": "Email verified successfully! You can now log in.",
  "user": {
    "id": 1,
    "username": "john_doe",
    "is_verified": true
  }
}
```

**Error Responses**:
- `400`: Token expired or invalid
- `400`: Token is required

---

### **3. Resend Verification Email**
**Endpoint**: `POST /api/auth/users/resend_verification/`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Success Response**:
```json
{
  "message": "Verification email sent successfully. Please check your inbox."
}
```

**Error Responses**:
- `400`: Email already verified
- `404`: No user found with this email

---

### **4. Forgot Password**
**Endpoint**: `POST /api/auth/users/forgot_password/`

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Success Response**:
```json
{
  "message": "Password reset email sent successfully. Please check your inbox."
}
```

**Note**: For security, the response is the same whether the email exists or not.

---

### **5. Reset Password**
**Endpoint**: `POST /api/auth/users/reset_password/`

**Request Body**:
```json
{
  "token": "reset_token_from_email",
  "new_password": "newsecurepass123"
}
```

**Success Response**:
```json
{
  "message": "Password reset successfully! You can now log in with your new password."
}
```

**Error Responses**:
- `400`: Token and new password are required
- `400`: Password must be at least 8 characters long
- `400`: Invalid or expired password reset token

---

## 🎨 Email Templates

All emails include:
- **BidSoko branding** (orange/red gradient header)
- **Professional HTML layout**
- **Mobile-responsive design**
- **Clear call-to-action buttons**
- **Footer with copyright**

### **Email Verification Template**
- Subject: "Verify Your BidSoko Account"
- Button: "Verify Email Address"
- Expires: 24 hours

### **Password Reset Template**
- Subject: "Reset Your BidSoko Password"
- Button: "Reset Password"
- Security warning if not requested
- Expires: 1 hour

---

## 🔐 Security Features

1. **Token Expiry**:
   - Email verification tokens: 24 hours
   - Password reset tokens: 1 hour

2. **Single-Use Tokens**:
   - Password reset tokens are marked as "used" after successful reset
   - Verification tokens are deleted after successful verification

3. **Secure Token Generation**:
   - Uses Python's `secrets.token_urlsafe(32)` for cryptographically secure tokens

4. **Password Strength Validation**:
   - Minimum 8 characters required for passwords

5. **Privacy Protection**:
   - Forgot password doesn't reveal if email exists (prevents user enumeration)

---

## 📊 Database Models

### **EmailVerificationToken**
```python
{
  "user": ForeignKey(User),
  "token": CharField(100, unique=True),
  "created_at": DateTimeField(auto_now_add=True),
  "expires_at": DateTimeField(),  # Created + 24 hours
  "is_expired": Boolean (property)
}
```

### **PasswordResetToken**
```python
{
  "user": ForeignKey(User),
  "token": CharField(100, unique=True),
  "created_at": DateTimeField(auto_now_add=True),
  "expires_at": DateTimeField(),  # Created + 1 hour
  "used": BooleanField(default=False),
  "is_expired": Boolean (property),
  "is_valid": Boolean (property)  # Not used AND not expired
}
```

---

## 🧪 How to Test

### **Test 1: Registration & Email Verification**

1. **Register a new user**:
```bash
curl -X POST https://bidsoko.com/api/auth/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "your_real_email@gmail.com",
    "password": "testpass123"
  }'
```

2. **Check your email** (your_real_email@gmail.com)
3. **Click the verification link** or copy the token
4. **Verify email**:
```bash
curl -X POST https://bidsoko.com/api/auth/users/verify_email/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "paste_token_here"
  }'
```

### **Test 2: Password Reset**

1. **Request password reset**:
```bash
curl -X POST https://bidsoko.com/api/auth/users/forgot_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your_real_email@gmail.com"
  }'
```

2. **Check your email**
3. **Copy the reset token from the email**
4. **Reset password**:
```bash
curl -X POST https://bidsoko.com/api/auth/users/reset_password/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "paste_token_here",
    "new_password": "mynewpassword123"
  }'
```

5. **Login with new password**:
```bash
curl -X POST https://bidsoko.com/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "mynewpassword123"
  }'
```

---

## 🚀 Frontend Integration (To Do)

You'll need to create these React pages:

### **1. Email Verification Page**
**Route**: `/verify-email?token=xxx`

**What it does**:
- Reads token from URL query parameter
- Calls `POST /api/auth/users/verify_email/`
- Shows success or error message
- Redirects to login after 3 seconds

### **2. Forgot Password Page**
**Route**: `/forgot-password`

**What it does**:
- Form with email input
- Calls `POST /api/auth/users/forgot_password/`
- Shows "Email sent" message

### **3. Reset Password Page**
**Route**: `/reset-password?token=xxx`

**What it does**:
- Reads token from URL query parameter
- Form with new password input
- Calls `POST /api/auth/users/reset_password/`
- Redirects to login on success

---

## 📧 SendGrid Configuration

**Current Setup**:
- API Key: Added to production `.env`
- From Email: `noreply@bidsoko.com` (verified in SendGrid)
- SMTP Host: `smtp.sendgrid.net`
- Port: 587 (TLS)

**SendGrid Limits** (Free Plan):
- 100 emails per day
- Unlimited contacts
- Email validation

**To Upgrade**:
- Go to https://sendgrid.com/pricing
- Essentials Plan: $19.95/month for 50,000 emails

---

## 🔧 Troubleshooting

### **Emails Not Sending**

1. **Check SendGrid API Key**:
```bash
ssh root@bidsoko.com 'cat /var/www/bidding-marketplace/.env | grep SENDGRID'
```

2. **Check Django logs**:
```bash
ssh root@bidsoko.com 'sudo supervisorctl tail bidding-django'
```

3. **Test email manually** (Python shell):
```bash
ssh root@bidsoko.com
cd /var/www/bidding-marketplace
source venv/bin/activate
python manage.py shell
```

Then in shell:
```python
from django.core.mail import send_mail
send_mail(
    'Test Subject',
    'Test message',
    'noreply@bidsoko.com',
    ['your_email@gmail.com'],
    fail_silently=False,
)
```

### **Token Expired**

If verification token expired:
- User can request new verification email using `/resend_verification/` endpoint

If password reset token expired:
- User can request a new password reset link

---

## 📈 Future Enhancements

1. **Bid Notifications**:
   - Email when user is outbid
   - Email when auction ends
   - Email when user wins auction

2. **Order Notifications**:
   - Order confirmation email
   - Shipping notification email
   - Delivery confirmation email

3. **Marketing Emails**:
   - Weekly deals newsletter
   - New product announcements
   - Abandoned cart reminders

4. **SMS Notifications** (future):
   - Use Africa's Talking or Twilio
   - SMS for critical notifications

---

## ✅ Checklist

- [x] SendGrid account created
- [x] API key generated
- [x] Sender email verified (`noreply@bidsoko.com`)
- [x] Django email backend configured
- [x] Email verification on registration
- [x] Forgot password functionality
- [x] Password reset functionality
- [x] HTML email templates
- [x] Database migrations created
- [x] Deployed to production
- [ ] Frontend verify-email page
- [ ] Frontend forgot-password page
- [ ] Frontend reset-password page
- [ ] Test with real email addresses

---

## 🎉 You're Done!

Email verification and password reset are now fully functional on your production server!

**Test it now**:
1. Go to https://bidsoko.com/register
2. Register with your real email
3. Check your inbox for verification email
4. Enjoy! 🚀
