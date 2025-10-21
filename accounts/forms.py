from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()


class SignUpForm(forms.ModelForm):
    """Custom signup form with password confirmation"""
    password1 = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(),
        min_length=8
    )
    password2 = forms.CharField(
        label='Confirm Password',
        widget=forms.PasswordInput(),
        min_length=8
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number']  # Removed user_type

    def clean_password2(self):
        """Validate that passwords match"""
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')

        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")

        return password2

    def clean_email(self):
        """Validate email is unique"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("This email is already registered")
        return email

    def clean_username(self):
        """Validate username is unique"""
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("This username is already taken")
        return username

    def save(self, commit=True):
        """Save user with hashed password - always as buyer"""
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        user.user_type = 'buyer'  # Force all signups to be buyers
        if commit:
            user.save()
        return user