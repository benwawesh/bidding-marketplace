"""
Custom throttling classes for payment endpoints
"""
from rest_framework.throttling import UserRateThrottle


class PaymentRateThrottle(UserRateThrottle):
    """
    Limit payment initiation requests to prevent abuse
    """
    scope = 'payment'


class AnonPaymentThrottle(UserRateThrottle):
    """
    Stricter limits for anonymous payment attempts
    """
    rate = '3/minute'
