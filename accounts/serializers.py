from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for general use"""
    # Add datetime field with time included
    date_joined = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'user_type', 'phone_number', 'gender', 'date_of_birth',
            'is_verified', 'wallet_balance',
            'auctions_won', 'auctions_participated', 'total_spent',
            'trust_score', 'date_joined', 'is_superuser'
        ]
        read_only_fields = [
            'id', 'is_verified', 'wallet_balance', 'auctions_won',
            'auctions_participated', 'total_spent', 'trust_score', 'date_joined', 'is_superuser'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone_number',
            'gender', 'date_of_birth'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone_number': {'required': True},
            'gender': {'required': True},
            'date_of_birth': {'required': True},
        }

    def validate(self, attrs):
        """Validate passwords match"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs

    def validate_email(self, value):
        """Check if email is already registered"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_phone_number(self, value):
        """Basic phone number validation"""
        # Allow phone numbers with or without country code
        # Just check it's not empty and has reasonable length
        if len(value) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits")
        return value

    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone_number'
        ]
        extra_kwargs = {
            'email': {'required': False},
        }

    def validate_email(self, value):
        """Check if email is already taken by another user"""
        user = self.instance
        if User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with case-insensitive username"""

    def validate(self, attrs):
        # Get username and make it case-insensitive
        username = attrs.get('username', '')

        # Find user case-insensitively
        try:
            user = User.objects.get(username__iexact=username)
            # Replace the username with the actual username from database
            attrs['username'] = user.username
        except User.DoesNotExist:
            pass  # Let the parent validator handle the error

        # Call parent validation (checks username/password)
        data = super().validate(attrs)

        # Note: No email verification check needed here since account
        # is only created after email is verified

        return data
