from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)
from .models import EmailVerificationToken, PasswordResetToken, PendingRegistration
from .utils import (
    generate_verification_token,
    send_verification_email,
    send_password_reset_email
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user management
    - Registration (public)
    - Profile management (authenticated)
    - User listing (authenticated)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'

    def get_permissions(self):
        """
        Allow public access for registration, require auth for everything else
        """
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action == 'update_profile':
            return UserProfileSerializer
        elif self.action == 'me':
            return UserSerializer  # ← FIXED: Now returns full user data with is_superuser
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """
        POST /api/auth/users/
        Store pending registration and send verification email
        Account will be created only after email verification
        """
        from django.contrib.auth.hashers import make_password

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Extract data from validated serializer
        validated_data = serializer.validated_data
        password = validated_data.pop('password')
        validated_data.pop('password2', None)

        # Generate verification token
        token = generate_verification_token()

        # Delete any existing pending registration with same username or email
        PendingRegistration.objects.filter(
            username__iexact=validated_data['username']
        ).delete()
        PendingRegistration.objects.filter(
            email__iexact=validated_data['email']
        ).delete()

        # Create pending registration (NOT creating user yet)
        pending_registration = PendingRegistration.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data['phone_number'],
            gender=validated_data['gender'],
            date_of_birth=validated_data['date_of_birth'],
            password_hash=make_password(password),  # Hash the password
            user_type=request.data.get('user_type', 'buyer'),
            token=token
        )

        # Send verification email with token
        email_sent = send_verification_email(
            type('obj', (object,), {
                'username': pending_registration.username,
                'email': pending_registration.email,
                'first_name': pending_registration.first_name
            })(),
            token
        )

        # Return response
        response_data = {
            'message': 'Verification email sent! Please check your email and click the verification link to complete your registration.',
            'email_sent': email_sent,
            'email': pending_registration.email
        }

        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        GET /api/auth/users/me/
        Get current authenticated user's profile
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """
        PATCH /api/auth/users/update_profile/
        Update current user's profile
        """
        serializer = self.get_serializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """
        GET /api/auth/users/stats/
        Get current user's statistics
        """
        user = request.user

        stats = {
            'user_type': user.user_type,
            'is_verified': user.is_verified,
            'wallet_balance': str(user.wallet_balance),
            'trust_score': user.trust_score,
            'auctions_won': user.auctions_won,
            'auctions_participated': user.auctions_participated,
            'total_spent': str(user.total_spent),
        }

        # Add seller-specific stats
        if user.user_type == 'seller':
            stats['auctions_created'] = user.created_auctions.count()
            stats['active_auctions'] = user.created_auctions.filter(status='active').count()

        return Response(stats)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_list(self, request):
        """
        GET /api/auth/users/admin_list/
        List all users with filters and search (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view all users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = User.objects.all().order_by('-date_joined')
        
        # Filter by user type
        user_type = request.query_params.get('user_type', None)
        if user_type:
            queryset = queryset.filter(user_type=user_type)
        
        # Filter by verification status
        is_verified = request.query_params.get('is_verified', None)
        if is_verified is not None:
            queryset = queryset.filter(is_verified=is_verified.lower() == 'true')
        
        # Search by username, email, or phone
        search = request.query_params.get('search', None)
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        serializer = UserSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_detail(self, request, id=None):
        """
        GET /api/auth/users/{id}/admin_detail/
        Get detailed user info including orders, bids, participations (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view user details'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        
        # Get user's orders
        from auctions.models import Order, Bid, Participation
        orders = Order.objects.filter(user=user).order_by('-created_at')[:10]
        
        # Get user's bids
        bids = Bid.objects.filter(user=user).select_related('auction').order_by('-submitted_at')[:10]
        
        # Get user's participations
        participations = Participation.objects.filter(user=user).select_related('auction').order_by('-created_at')[:10]
        
        # Calculate stats
        from django.db.models import Sum, Count
        order_stats = Order.objects.filter(user=user, status__in=['paid', 'processing', 'shipped', 'delivered']).aggregate(
            total_orders=Count('id'),
            total_spent=Sum('total_amount')
        )
        
        data = {
            'user': UserSerializer(user).data,
            'recent_orders': [{
                'id': str(order.id),
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'status': order.status,
                'created_at': order.created_at,
            } for order in orders],
            'recent_bids': [{
                'id': str(bid.id),
                'auction_title': bid.auction.title,
                'pledge_amount': str(bid.pledge_amount),
                'submitted_at': bid.submitted_at,
            } for bid in bids],
            'recent_participations': [{
                'id': str(p.id),
                'auction_title': p.auction.title,
                'fee_paid': str(p.fee_paid),
                'paid_at': p.paid_at,
            } for p in participations],
            'stats': {
                'total_orders': order_stats['total_orders'] or 0,
                'total_spent': str(order_stats['total_spent'] or 0),
                'total_bids': bids.count(),
                'total_participations': participations.count(),
            }
        }
        
        return Response(data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_stats(self, request):
        """
        GET /api/auth/users/admin_stats/
        Get overall user statistics (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can view stats'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        total_users = User.objects.count()
        buyers = User.objects.filter(user_type='buyer').count()
        sellers = User.objects.filter(user_type='seller').count()
        admins = User.objects.filter(user_type='admin').count()
        verified = User.objects.filter(is_verified=True).count()
        
        # Get users registered in last 30 days
        from django.utils import timezone
        from datetime import timedelta
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_users = User.objects.filter(date_joined__gte=thirty_days_ago, is_superuser=False).count()
        
        return Response({
            'total_users': total_users,
            'buyers': buyers,
            'sellers': sellers,
            'admins': admins,
            'verified': verified,
            'new_users_last_30_days': new_users,
        })

    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def admin_delete(self, request, id=None):
        """
        DELETE /api/auth/users/{id}/admin_delete/
        Delete a user account (Admin only)
        """
        if not request.user.is_superuser:
            return Response(
                {'error': 'Only admins can delete users'},
                status=status.HTTP_403_FORBIDDEN
            )

        user = self.get_object()

        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot delete your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent deleting other superusers
        if user.is_superuser:
            return Response(
                {'error': 'Cannot delete superuser accounts'},
                status=status.HTTP_400_BAD_REQUEST
            )

        username = user.username
        user.delete()

        return Response({
            'message': f'User {username} has been successfully deleted'
        })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify_email(self, request):
        """
        POST /api/auth/users/verify_email/
        Verify email and create user account from pending registration
        Body: {"token": "verification_token"}
        """
        token = request.data.get('token')

        if not token:
            return Response(
                {'error': 'Verification token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Try to find pending registration first
            pending = PendingRegistration.objects.get(token=token)

            if pending.is_expired:
                pending.delete()
                return Response(
                    {'error': 'Verification link has expired. Please register again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if username or email already exists
            if User.objects.filter(username__iexact=pending.username).exists():
                return Response(
                    {'error': 'Username is already taken. Please register with a different username.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email__iexact=pending.email).exists():
                return Response(
                    {'error': 'Email is already registered. Please login or use a different email.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the actual user account now
            user = User.objects.create(
                username=pending.username,
                email=pending.email,
                first_name=pending.first_name,
                last_name=pending.last_name,
                phone_number=pending.phone_number,
                gender=pending.gender,
                date_of_birth=pending.date_of_birth,
                user_type=pending.user_type,
                password=pending.password_hash,  # Already hashed
                is_verified=True  # Mark as verified immediately
            )

            # Delete the pending registration
            pending.delete()

            return Response({
                'message': 'Email verified successfully! Your account has been created. You can now log in.',
                'user': UserSerializer(user).data
            })

        except PendingRegistration.DoesNotExist:
            # Maybe it's an old email verification token (from existing users)
            try:
                verification = EmailVerificationToken.objects.get(token=token)

                if verification.is_expired:
                    return Response(
                        {'error': 'Verification token has expired. Please request a new one.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Mark existing user as verified
                user = verification.user
                user.is_verified = True
                user.save()

                # Delete the verification token
                verification.delete()

                return Response({
                    'message': 'Email verified successfully! You can now log in.',
                    'user': UserSerializer(user).data
                })

            except EmailVerificationToken.DoesNotExist:
                return Response(
                    {'error': 'Invalid or expired verification token'},
                    status=status.HTTP_400_BAD_REQUEST
                )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def resend_verification(self, request):
        """
        POST /api/auth/users/resend_verification/
        Resend verification email
        Body: {"email": "user@example.com"}
        """
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            if user.is_verified:
                return Response(
                    {'error': 'Email is already verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Generate new verification token
            token = generate_verification_token()

            # Delete old tokens and create new one
            EmailVerificationToken.objects.filter(user=user).delete()
            EmailVerificationToken.objects.create(user=user, token=token)

            # Send verification email
            email_sent = send_verification_email(user, token)

            if email_sent:
                return Response({
                    'message': 'Verification email sent successfully. Please check your inbox.'
                })
            else:
                return Response(
                    {'error': 'Failed to send verification email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except User.DoesNotExist:
            return Response(
                {'error': 'No user found with this email'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def forgot_password(self, request):
        """
        POST /api/auth/users/forgot_password/
        Request password reset email
        Body: {"email": "user@example.com"}
        """
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)

            # Generate password reset token
            token = generate_verification_token()

            # Create password reset token
            PasswordResetToken.objects.create(user=user, token=token)

            # Send password reset email
            email_sent = send_password_reset_email(user, token)

            if email_sent:
                return Response({
                    'message': 'Password reset email sent successfully. Please check your inbox.'
                })
            else:
                return Response(
                    {'error': 'Failed to send password reset email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except User.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response({
                'message': 'If an account exists with this email, a password reset link has been sent.'
            })

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def reset_password(self, request):
        """
        POST /api/auth/users/reset_password/
        Reset password with token
        Body: {"token": "reset_token", "new_password": "newpass123"}
        """
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not token or not new_password:
            return Response(
                {'error': 'Token and new password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password strength
        if len(new_password) < 8:
            return Response(
                {'error': 'Password must be at least 8 characters long'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reset_token = PasswordResetToken.objects.get(token=token)

            if not reset_token.is_valid:
                return Response(
                    {'error': 'Invalid or expired password reset token'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Reset the password
            user = reset_token.user
            user.set_password(new_password)
            user.save()

            # Mark token as used
            reset_token.used = True
            reset_token.save()

            return Response({
                'message': 'Password reset successfully! You can now log in with your new password.'
            })

        except PasswordResetToken.DoesNotExist:
            return Response(
                {'error': 'Invalid password reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )
