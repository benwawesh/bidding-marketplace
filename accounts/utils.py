"""
Utility functions for accounts app including email sending and token generation
IMPROVED VERSION with spam prevention
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
    with spam prevention best practices
    """
    # Use localhost for development, production domain otherwise
    base_url = "http://localhost:5173" if settings.DEBUG else "https://bidsoko.com"
    verification_link = f"{base_url}/verify-email?token={verification_token}"
    unsubscribe_link = f"{base_url}/unsubscribe?email={user.email}"

    subject = "Verify Your BidSoko Account"

    # Plain text version (required for deliverability)
    plain_text = f"""
Hi {user.username},

Thank you for creating a BidSoko account. To complete your registration, please verify your email address.

Click or copy this link to verify your email:
{verification_link}

This verification link will expire in 24 hours.

If you did not create a BidSoko account, you can safely ignore this email.

Best regards,
The BidSoko Team
https://bidsoko.com

Kenya's Premier Online Shopping and Auction Platform

---
BidSoko, Kenya
This email was sent to {user.email}
Unsubscribe: {unsubscribe_link}
    """

    # HTML version
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your BidSoko Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BidSoko</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Account Verification</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px;">Hi <strong>{user.username}</strong>,</p>

                            <p style="margin: 0 0 20px 0; font-size: 16px;">Thank you for creating a BidSoko account. To complete your registration and access all features, please verify your email address.</p>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{verification_link}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; font-size: 14px; color: #666666;">If the button does not work, copy and paste this link into your browser:</p>

                            <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-size: 14px; color: #ea580c;">{verification_link}</p>

                            <p style="margin: 20px 0; font-size: 14px;"><strong>Note:</strong> This verification link will expire in 24 hours for security purposes.</p>

                            <p style="margin: 20px 0; font-size: 14px; color: #666666;">If you did not create a BidSoko account, you can safely ignore this email.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; text-align: center; color: #666666;">Best regards,<br>The BidSoko Team</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center; color: #999999;">&copy; 2024 BidSoko. All rights reserved.</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center; color: #999999;">Kenya's Premier Online Shopping and Auction Platform</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center;">
                                <a href="https://bidsoko.com" style="color: #ea580c; text-decoration: none;">Visit Website</a> |
                                <a href="https://bidsoko.com/contact" style="color: #ea580c; text-decoration: none;">Contact Us</a> |
                                <a href="{unsubscribe_link}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
                            </p>
                            <p style="margin: 10px 0; font-size: 11px; text-align: center; color: #999999;">
                                BidSoko, Kenya<br>
                                This email was sent to {user.email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """

    try:
        # In development, print the verification link to console
        if settings.DEBUG:
            print("\n" + "="*80)
            print("EMAIL VERIFICATION LINK (Development Mode)")
            print("="*80)
            print(f"To: {user.email}")
            print(f"Username: {user.username}")
            print(f"Verification Link: {verification_link}")
            print("="*80 + "\n")

        from sendgrid.helpers.mail import ClickTracking, TrackingSettings, OpenTracking

        message = Mail(
            from_email=Email(settings.DEFAULT_FROM_EMAIL, "BidSoko"),
            to_emails=To(user.email),
            subject=subject,
            plain_text_content=Content("text/plain", plain_text),
            html_content=Content("text/html", html_content)
        )

        # Set reply-to address
        message.reply_to = Email("support@bidsoko.com", "BidSoko Support")

        # Add List-Unsubscribe header for better deliverability (RFC 2369)
        from sendgrid.helpers.mail import Header
        message.add_header(Header("List-Unsubscribe", f"<{unsubscribe_link}>"))
        message.add_header(Header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click"))

        # Add additional spam-prevention headers
        user_id = getattr(user, 'id', 'pending')
        message.add_header(Header("X-Entity-Ref-ID", f"verification-{user_id}"))
        message.add_header(Header("Precedence", "bulk"))

        # Disable click tracking to avoid SendGrid redirect URLs
        message.tracking_settings = TrackingSettings()
        message.tracking_settings.click_tracking = ClickTracking(enable=False, enable_text=False)
        message.tracking_settings.open_tracking = OpenTracking(enable=True)

        sg = SendGridAPIClient(settings.EMAIL_HOST_PASSWORD)
        response = sg.send(message)

        print(f"SendGrid response status: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_password_reset_email(user, reset_token):
    """
    Send password reset link to user using SendGrid API
    with spam prevention best practices
    """
    # Use localhost for development, production domain otherwise
    base_url = "http://localhost:5173" if settings.DEBUG else "https://bidsoko.com"
    reset_link = f"{base_url}/reset-password?token={reset_token}"
    unsubscribe_link = f"{base_url}/unsubscribe?email={user.email}"

    subject = "Reset Your BidSoko Password"

    # Plain text version
    plain_text = f"""
Hi {user.username},

We received a request to reset the password for your BidSoko account.

Click or copy this link to reset your password:
{reset_link}

This password reset link will expire in 1 hour for security purposes.

IMPORTANT: If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.

Best regards,
The BidSoko Team
https://bidsoko.com

Kenya's Premier Online Shopping and Auction Platform

---
BidSoko, Kenya
This email was sent to {user.email}
Unsubscribe: {unsubscribe_link}
    """

    # HTML version
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your BidSoko Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ea580c 0%, #dc2626 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BidSoko</h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">Password Reset Request</p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px;">Hi <strong>{user.username}</strong>,</p>

                            <p style="margin: 0 0 20px 0; font-size: 16px;">We received a request to reset the password for your BidSoko account. Click the button below to create a new password.</p>

                            <!-- Button -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{reset_link}" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: 600;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0; font-size: 14px; color: #666666;">If the button does not work, copy and paste this link into your browser:</p>

                            <p style="margin: 0 0 20px 0; padding: 12px; background-color: #f9fafb; border-radius: 4px; word-break: break-all; font-size: 14px; color: #ea580c;">{reset_link}</p>

                            <p style="margin: 20px 0; font-size: 14px;"><strong>Note:</strong> This password reset link will expire in 1 hour for security purposes.</p>

                            <!-- Security Warning -->
                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                                        <p style="margin: 0; font-size: 14px;"><strong>Security Notice:</strong> If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; font-size: 14px; text-align: center; color: #666666;">Best regards,<br>The BidSoko Team</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center; color: #999999;">&copy; 2024 BidSoko. All rights reserved.</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center; color: #999999;">Kenya's Premier Online Shopping and Auction Platform</p>
                            <p style="margin: 10px 0; font-size: 12px; text-align: center;">
                                <a href="https://bidsoko.com" style="color: #ea580c; text-decoration: none;">Visit Website</a> |
                                <a href="https://bidsoko.com/contact" style="color: #ea580c; text-decoration: none;">Contact Us</a> |
                                <a href="{unsubscribe_link}" style="color: #999999; text-decoration: none;">Unsubscribe</a>
                            </p>
                            <p style="margin: 10px 0; font-size: 11px; text-align: center; color: #999999;">
                                BidSoko, Kenya<br>
                                This email was sent to {user.email}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """

    try:
        from sendgrid.helpers.mail import ClickTracking, TrackingSettings, OpenTracking

        message = Mail(
            from_email=Email(settings.DEFAULT_FROM_EMAIL, "BidSoko"),
            to_emails=To(user.email),
            subject=subject,
            plain_text_content=Content("text/plain", plain_text),
            html_content=Content("text/html", html_content)
        )

        # Set reply-to address
        message.reply_to = Email("support@bidsoko.com", "BidSoko Support")

        # Add List-Unsubscribe header for better deliverability (RFC 2369)
        from sendgrid.helpers.mail import Header
        message.add_header(Header("List-Unsubscribe", f"<{unsubscribe_link}>"))
        message.add_header(Header("List-Unsubscribe-Post", "List-Unsubscribe=One-Click"))

        # Add additional spam-prevention headers
        user_id = getattr(user, 'id', 'unknown')
        message.add_header(Header("X-Entity-Ref-ID", f"password-reset-{user_id}"))
        message.add_header(Header("Precedence", "bulk"))

        # Disable click tracking to avoid SendGrid redirect URLs
        message.tracking_settings = TrackingSettings()
        message.tracking_settings.click_tracking = ClickTracking(enable=False, enable_text=False)
        message.tracking_settings.open_tracking = OpenTracking(enable=True)

        sg = SendGridAPIClient(settings.EMAIL_HOST_PASSWORD)
        response = sg.send(message)

        print(f"SendGrid response status: {response.status_code}")
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def send_bid_notification_email(user, auction_title, bid_amount, current_status):
    """
    Send notification email when user places a bid or auction status changes
    (This function still uses Django's send_mail - needs SendGrid API update if critical)
    """
    from django.core.mail import send_mail

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
            fail_silently=True,
        )
        return True
    except Exception as e:
        print(f"Error sending bid notification email: {e}")
        return False
