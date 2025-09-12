from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
import random
import string

from .models import CustomUser
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer

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
        
        # Send verification email
        try:
            send_mail(
                'Vérification de votre compte PneuShop',
                f'Votre code de vérification est: {verification_code}',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Erreur envoi email: {e}")
        
        return Response({
            'message': 'Compte créé avec succès. Vérifiez votre email.',
            'user_id': user.id
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
        'user': UserSerializer(user).data,
        'role': user.role
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
        reset_code = ''.join(random.choices(string.digits, k=6))
        user.verification_code = reset_code
        user.save()
        
        # Send reset email
        send_mail(
            'Réinitialisation de mot de passe - PneuShop',
            f'Votre code de réinitialisation est: {reset_code}',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return Response({'message': 'Code de réinitialisation envoyé.'})
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
    """Reset password with verification code"""
    email = request.data.get('email')
    code = request.data.get('code')
    new_password = request.data.get('new_password')
    
    try:
        user = CustomUser.objects.get(email=email)
        if user.verification_code == code:
            user.set_password(new_password)
            user.verification_code = ''
            user.save()
            return Response({'message': 'Mot de passe réinitialisé avec succès.'})
        else:
            return Response({'error': 'Code de vérification incorrect.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé.'}, 
                      status=status.HTTP_404_NOT_FOUND)
