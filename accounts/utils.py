"""
Utility functions for accounts app including email sending and token generation
"""
import secrets
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content


def generate_verification_token():
    """Generate a secure random token for email verification"""
    return secrets.token_urlsafe(32)


def send_verification_email(user, verification_token):
    """
    Send email verification link to user using SendGrid API
    """
    verification_link = f"https://bidsoko.com/verify-email?token={verification_token}"

    subject = "Verify Your BidSoko Account"

    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to BidSoko!</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.username}</strong>,</p>
            <p>Thank you for signing up! We're excited to have you join our community.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{verification_link}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">{verification_link}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account on BidSoko, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 BidSoko. All rights reserved.</p>
            <p>Kenya's Premier Online Shopping & Auction Platform</p>
        </div>
    </div>
</body>
</html>
    """

    try:
        message = Mail(
            from_email=Email(settings.DEFAULT_FROM_EMAIL),
            to_emails=To(user.email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )

        # Disable click tracking to avoid SendGrid redirect URLs
        from sendgrid.helpers.mail import ClickTracking, TrackingSettings
        message.tracking_settings = TrackingSettings()
        message.tracking_settings.click_tracking = ClickTracking(enable=False, enable_text=False)

        sg = SendGridAPIClient(settings.EMAIL_HOST_PASSWORD)
        response = sg.send(message)

        print(f"SendGrid response status: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_password_reset_email(user, reset_token):
    """
    Send password reset link to user
    """
    reset_link = f"https://bidsoko.com/reset-password?token={reset_token}"

    subject = "Reset Your BidSoko Password"
    message = f"""
Hi {user.username},

We received a request to reset your password for your BidSoko account.

Click the link below to reset your password:

{reset_link}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The BidSoko Team
https://bidsoko.com
    """

    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.username}</strong>,</p>
            <p>We received a request to reset the password for your BidSoko account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{reset_link}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">{reset_link}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 BidSoko. All rights reserved.</p>
            <p>Kenya's Premier Online Shopping & Auction Platform</p>
        </div>
    </div>
</body>
</html>
    """

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def send_bid_notification_email(user, auction_title, bid_amount, current_status):
    """
    Send notification email when user places a bid or auction status changes
    """
    subject = f"Bid Update: {auction_title}"

    message = f"""
Hi {user.username},

Your bid on "{auction_title}" has been updated.

Bid Amount: KSh {bid_amount:,.2f}
Status: {current_status}

View auction details: https://bidsoko.com/auction/{auction_title}

Best regards,
The BidSoko Team
    """

    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .bid-info {{ background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Bid Update</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{user.username}</strong>,</p>
            <p>Your bid has been updated for:</p>
            <div class="bid-info">
                <h2>{auction_title}</h2>
                <p><strong>Your Bid:</strong> KSh {bid_amount:,.2f}</p>
                <p><strong>Status:</strong> {current_status}</p>
            </div>
            <p>Good luck!</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 BidSoko. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    """

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=True,  # Don't fail if notification email fails
        )
        return True
    except Exception as e:
        print(f"Error sending bid notification email: {e}")
        return False
