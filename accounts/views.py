import random
import string

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.http import HttpResponse

from .models import CustomUser, UserActivityLog
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .email_utils import send_verification_email, send_welcome_email, send_password_reset_email


def _log_activity(user, action, description, request=None, target_email=''):
    """Helper to create a UserActivityLog entry. Delegates to accounts.activity."""
    from .activity import log_activity
    log_activity(user, action, description, request=request, target_email=target_email)


def _is_admin(user):
    return getattr(user, 'role', None) == 'admin' or user.is_superuser


def get_frontend_url(request):
    """
    Auto-detect frontend URL from request headers.
    Priority: 1) Origin header, 2) Referer header, 3) Configured FRONTEND_URL
    """
    frontend_url = request.META.get('HTTP_ORIGIN')
    if frontend_url:
        print(f'✅ Detected frontend URL from Origin: {frontend_url}')
        return frontend_url

    referer = request.META.get('HTTP_REFERER')
    if referer:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            frontend_url = f'{parsed.scheme}://{parsed.netloc}'
            print(f'✅ Detected frontend URL from Referer: {frontend_url}')
            return frontend_url
        except Exception:
            pass

    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    print(f'⚠️ Using fallback FRONTEND_URL from settings: {frontend_url}')
    return frontend_url


def index(request):
    """Testing endpoint"""
    if request.GET.get('test') == '1':
        send_mail(
            'Registration Testing',
            'This is a testing email for SMTP verification.',
            settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else settings.DEFAULT_FROM_EMAIL,
            ['zmarketingcompany@gmail.com'],
        )
        return HttpResponse('Test email sent!')
    return HttpResponse('Go to /?test=1 to trigger test email.')


class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        verification_code = ''.join(random.choices(string.digits, k=6))
        user.verification_code = verification_code
        user.save()

        frontend_url = get_frontend_url(request)
        try:
            send_verification_email(user, verification_code, frontend_url)
            print(f'✅ Verification email sent to {user.email}')
        except Exception as e:
            print(f'❌ Failed to send verification email: {str(e)}')

        return Response(
            {'message': 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.', 'id': user.id},
            status=status.HTTP_201_CREATED,
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = UserLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    # Log login only for staff/admin accounts
    if user.role not in ('customer',):
        _log_activity(user, 'login', f'Connexion au back-office', request=request)
    return Response({
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': UserSerializer(user).data,
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
            try:
                send_welcome_email(user)
                print(f'✅ Welcome email sent to verified user: {user.email}')
            except Exception as e:
                print(f'⚠️  Email verified but welcome email failed: {str(e)}')
            return Response({'message': 'Email vérifié avec succès. Bienvenue chez PneuShop!'})
        else:
            return Response({'error': 'Code de vérification incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Utilisateur non trouvé.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    try:
        user = CustomUser.objects.get(email=email)
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        frontend_url = get_frontend_url(request)
        reset_url = f'{frontend_url}/auth/reset-password?uid={uid}&token={token}'
        print(f'🔗 Reset URL: {reset_url}')

        request_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'Unknown'))
        try:
            send_password_reset_email(user, reset_url, token=token, request_ip=request_ip)
            print(f'✉️ Password reset email sent to {user.email}')
        except Exception as e:
            print(f'❌ Erreur envoi email de réinitialisation: {str(e)}')
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Instructions de réinitialisation envoyées par email.'})
    except CustomUser.DoesNotExist:
        return Response({'error': 'Email non trouvé.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """Get or update current user profile information"""
    user = request.user
    if request.method == 'PATCH':
        data = request.data
        for field in ['first_name', 'last_name', 'phone', 'address', 'email']:
            if field in data:
                setattr(user, field, data[field])
        serializer = UserSerializer(user, data=data, partial=True)
        if serializer.is_valid():
            user.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response(UserSerializer(user).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with secure token"""
    uid = request.data.get('uid') or request.data.get('token', '').split('uid=')[-1]
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    try:
        user_id = urlsafe_base64_decode(uid).decode()
        user = CustomUser.objects.get(pk=user_id)
        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Mot de passe réinitialisé avec succès.'})
        else:
            return Response({'error': 'Token invalide ou expiré.'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'Lien de réinitialisation invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Lien de réinitialisation invalide.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token(request):
    """Verify if reset token is valid"""
    uid = request.data.get('uid') or request.data.get('token', '')
    token = request.data.get('token')
    try:
        user_id = urlsafe_base64_decode(uid).decode()
        user = CustomUser.objects.get(pk=user_id)
        if default_token_generator.check_token(user, token):
            return Response({'message': 'Token valide', 'email': user.email})
        return Response({'error': 'Token invalide ou expiré'}, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Token invalide'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clients_list(request):
    clients = CustomUser.objects.filter(role='customer')
    serializer = UserSerializer(clients, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_staff_users(request):
    """
    List all non-customer users with optional role filtering
    Query params:
    - role: Optional filter by role (purchasing, sales, or admin)
    """
    user = request.user
    if getattr(user, 'role', None) != 'admin' and not user.is_superuser:
        return Response({'error': 'You do not have permission to view this resource'}, status=status.HTTP_403_FORBIDDEN)

    role = request.query_params.get('role')
    users = CustomUser.objects.exclude(role='customer')
    if role:
        users = users.filter(role=role)

    print(f'Query: {role}, Found {users.count()} users with role: {role}')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_user(request):
    user = request.user
    if getattr(user, 'role', None) != 'admin' and not user.is_superuser:
        return Response({'error': 'You do not have permission to perform this action'}, status=status.HTTP_403_FORBIDDEN)

    role = request.data.get('role')
    if role not in ('purchasing', 'sales', 'responsable_achats', 'admin'):
        return Response({'error': 'Rôle invalide'}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    data['is_verified'] = True
    # Map camelCase firstName/lastName to Django first_name/last_name
    if 'firstName' in data and 'first_name' not in data:
        data['first_name'] = data['firstName']
    if 'lastName' in data and 'last_name' not in data:
        data['last_name'] = data['lastName']
    if 'first_name' not in data:
        data['first_name'] = ''
    if 'last_name' not in data:
        data['last_name'] = ''
    if 'username' not in data:
        data['username'] = data.get('email', '')

    serializer = UserRegistrationSerializer(data=data)
    if serializer.is_valid():
        new_user = serializer.save()
        new_user.role = role
        new_user.is_verified = True
        new_user.is_active = True
        new_user.save()
        try:
            send_welcome_email(new_user)
        except Exception as e:
            print(f'Error sending welcome email: {str(e)}')

        _log_activity(user, 'create_user',
                      f'Création du compte {role} pour {new_user.email}',
                      request=request, target_email=new_user.email)

        response_data = UserSerializer(new_user).data
        return Response({**response_data, 'message': f'{role.capitalize()} account created successfully'}, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def update_user(request, user_id):
    user = request.user
    if getattr(user, 'role', None) != 'admin' and not user.is_superuser:
        return Response({'error': 'You do not have permission to perform this action'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'DELETE':
        return delete_user(request, user_id)

    try:
        target_user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if target_user.is_superuser:
        return Response({'error': 'Cannot modify superuser account'}, status=status.HTTP_400_BAD_REQUEST)

    data = request.data.copy()
    password = data.pop('password', None)

    # Map camelCase to snake_case field names
    field_map = {'firstName': 'first_name', 'lastName': 'last_name'}
    update_data = {}
    for k, v in data.items():
        mapped_key = field_map.get(k, k)
        # Only set fields that exist on the model
        if hasattr(target_user, mapped_key):
            update_data[mapped_key] = v

    for field, value in update_data.items():
        setattr(target_user, field, value)

    if password:
        target_user.set_password(password)

    target_user.save()
    _log_activity(user, 'update_user',
                  f'Modification du compte {target_user.email}',
                  request=request, target_email=target_user.email)
    return Response({'message': 'User updated successfully', **UserSerializer(target_user).data})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    user = request.user
    if getattr(user, 'role', None) != 'admin' and not user.is_superuser:
        return Response({'error': 'You do not have permission to perform this action'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if target_user == user:
        return Response({'error': 'You cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)

    if target_user.is_superuser:
        return Response({'error': 'Cannot delete superuser account'}, status=status.HTTP_400_BAD_REQUEST)

    email = target_user.email
    target_user.delete()
    _log_activity(user, 'delete_user',
                  f'Suppression du compte {email}',
                  request=request, target_email=email)
    return Response({'message': 'User deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_active(request, user_id):
    """PATCH /api/accounts/admin/toggle-user/<id>/ — Activate or deactivate a user."""
    if not _is_admin(request.user):
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'error': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if target_user == request.user:
        return Response({'error': 'Impossible de modifier votre propre compte'}, status=status.HTTP_400_BAD_REQUEST)

    if target_user.is_superuser:
        return Response({'error': 'Impossible de modifier un superutilisateur'}, status=status.HTTP_400_BAD_REQUEST)

    target_user.is_active = not target_user.is_active
    target_user.save(update_fields=['is_active'])

    action_label = 'activé' if target_user.is_active else 'désactivé'
    _log_activity(request.user, 'toggle_user',
                  f'Compte {target_user.email} {action_label}',
                  request=request, target_email=target_user.email)

    return Response({'message': f'Compte {action_label}', 'is_active': target_user.is_active})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_activity_logs(request):
    """GET /api/accounts/admin/journal/ — List staff activity logs (admin only)."""
    if not _is_admin(request.user):
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    logs = UserActivityLog.objects.select_related('user').order_by('-created_at')[:500]
    data = [
        {
            'id': log.id,
            'user_email': log.user.email if log.user else '—',
            'user_name': (
                f'{log.user.first_name} {log.user.last_name}'.strip() or log.user.email
            ) if log.user else '—',
            'action': log.action,
            'action_label': log.get_action_display(),
            'description': log.description,
            'target_user_email': log.target_user_email,
            'ip_address': log.ip_address,
            'created_at': log.created_at.isoformat(),
        }
        for log in logs
    ]
    return Response(data)
