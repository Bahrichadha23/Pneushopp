from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
import random
import string

from .models import CustomUser
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .email_utils import send_welcome_email, send_password_reset_email

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate verification code
        verification_code = ''.join(random.choices(string.digits, k=6))
        user.verification_code = verification_code
        user.save()
        
        # Send welcome email with verification
        try:
            send_welcome_email(user)
            print(f"Welcome email sent to {user.email}")
        except Exception as e:
            print(f"Erreur envoi email de bienvenue: {e}")
        
        # Send verification email
        try:
            send_mail(
                'Vérification de votre compte PneuShop',
                f'Votre code de vérification est: {verification_code}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True,
            )
            print(f"Verification email sent to {user.email}")
        except Exception as e:
            print(f"Erreur envoi email de vérification: {e}")
        
        return Response({
            'success': True,
            'message': 'Compte créé avec succès. Vérifiez votre email.',
            'user_id': user.id,
            'user': UserSerializer(user).data  # Add user data

        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    user_id = request.data.get('user_id')
    code = request.data.get('code')
    
    try:
        user = CustomUser.objects.get(id=user_id)
        if user.verification_code == code:
            user.is_verified = True
            user.verification_code = ''
            user.save()
            return Response({'message': 'Email vérifié avec succès.'})
        else:
            return Response({'error': 'Code de vérification incorrect.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé.'}, 
                      status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        user = CustomUser.objects.get(email=email)
        
        # Generate secure token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create reset URL
        reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"
        
        # Get client IP for security
        request_ip = request.META.get('HTTP_X_FORWARDED_FOR', 
                                    request.META.get('REMOTE_ADDR', 'Unknown'))
        
        # Send password reset email
        try:
            send_password_reset_email(user, reset_url, token, request_ip)
            print(f"Password reset email sent to {user.email}")
        except Exception as e:
            print(f"Erreur envoi email de réinitialisation: {e}")
        
        return Response({
            'message': 'Instructions de réinitialisation envoyées par email.',
            'uid': uid,  # For development/testing
            'token': token  # For development/testing
        })
    except CustomUser.DoesNotExist:
        return Response({'error': 'Email non trouvé.'}, 
                      status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def user_profile(request):
    """Get current user profile information"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with secure token"""
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    
    try:
        # Decode user ID
        user_id = urlsafe_base64_decode(uid).decode()
        user = CustomUser.objects.get(pk=user_id)
        
        # Verify token
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Mot de passe réinitialisé avec succès.'})
        else:
            return Response({'error': 'Token invalide ou expiré.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, CustomUser.DoesNotExist):
        return Response({'error': 'Lien de réinitialisation invalide.'}, 
                      status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """Verify if reset token is valid"""
    uid = request.data.get('uid')
    token = request.data.get('token')
    
    try:
        user_id = urlsafe_base64_decode(uid).decode()
        user = CustomUser.objects.get(pk=user_id)
        
        if default_token_generator.check_token(user, token):
            return Response({
                'valid': True,
                'email': user.email,
                'message': 'Token valide'
            })
        else:
            return Response({
                'valid': False,
                'message': 'Token invalide ou expiré'
            }, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, CustomUser.DoesNotExist):
        return Response({
            'valid': False,
            'message': 'Token invalide'
        }, status=status.HTTP_404_NOT_FOUND)
