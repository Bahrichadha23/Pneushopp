from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def send_verification_email(user, verification_code, frontend_url=None):
    """Send email verification with code"""
    if frontend_url is None:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    subject = 'Vérifiez votre email - PneuShop'
    verification_url = f"{frontend_url}/auth/verify-email?user_id={user.id}&code={verification_code}"

    html_content = render_to_string('emails/email_verification.html', {
        'user': user,
        'verification_url': verification_url,
        'verification_code': verification_code,
        'frontend_url': frontend_url,
    })
    text_content = strip_tags(html_content)

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'Verification email sent successfully to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send verification email to {user.email}: {str(e)}')
        raise


def send_welcome_email(user):
    """Send welcome email to newly registered user"""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    subject = 'Bienvenue chez PneuShop !'

    html_content = render_to_string('emails/welcome_email.html', {
        'user': user,
        'frontend_url': frontend_url,
    })
    text_content = strip_tags(html_content)

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'Welcome email sent successfully to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send welcome email to {user.email}: {str(e)}')
        raise


def send_password_reset_email(user, reset_url, token=None, request_ip=None):
    """Send password reset email with secure token"""
    subject = 'Réinitialisation de votre mot de passe PneuShop'

    html_content = render_to_string('emails/password_reset_email.html', {
        'user': user,
        'reset_url': reset_url,
        'token': token,
        'request_ip': request_ip,
        'now': timezone.now(),
    })
    text_content = strip_tags(html_content)

    try:
        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'Password reset email sent successfully to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send password reset email to {user.email}: {str(e)}')
        raise


def send_order_confirmation_email(order):
    """
    Send order confirmation email with HTML template
    Sends to BOTH customer AND admin
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        subtotal = float(order.total_amount) - float(getattr(order, 'delivery_cost', 0) or 0)

        # 1. Email to customer
        subject = f'Confirmation de commande n°{order.id} - PneuShop'
        html_content = render_to_string('emails/order_confirmation_email.html', {
            'order': order,
            'subtotal': subtotal,
            'frontend_url': frontend_url,
        })
        text_content = strip_tags(html_content)

        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'✅ Order confirmation email sent to CUSTOMER: {order.user.email} for order #{order.id}')

        # 2. Notification email to admin
        admin_subject = f'🔔 Nouvelle commande n°{order.id} - {order.user.get_full_name() or order.user.email}'
        phone_number = getattr(order.user, 'phone_number', 'N/A')
        admin_html = render_to_string('emails/order_notification_admin.html', {
            'order': order,
            'subtotal': subtotal,
            'frontend_url': frontend_url,
            'customer_phone': phone_number,
        })
        admin_text = strip_tags(admin_html)
        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@pneushop.tn')

        send_mail(
            subject=admin_subject,
            message=admin_text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[admin_email],
            html_message=admin_html,
            fail_silently=False,
        )
        logger.info(f'✅ Order notification email sent to ADMIN: {admin_email}')

    except Exception as e:
        logger.error(f'Failed to send order confirmation email for order #{order.id}: {str(e)}')
        raise


def send_new_order_notification_email(order):
    """
    Send internal notification to sales responsible when a new order is created.
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        sales_email = getattr(settings, 'SALES_EMAIL', getattr(settings, 'ADMIN_EMAIL', 'pneushop.contact@gmail.com'))
        subtotal = float(order.total_amount) - float(getattr(order, 'delivery_cost', 0) or 0)

        subject = f'🛒 Nouvelle commande #{order.id} - Responsable Vente PneuShop'
        html_content = render_to_string('emails/order_notification_admin.html', {
            'order': order,
            'subtotal': subtotal,
            'frontend_url': frontend_url,
            'customer_phone': getattr(order.user, 'phone_number', 'N/A'),
        })
        text_content = strip_tags(html_content)

        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[sales_email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'✅ Sales notification email sent to {sales_email} for order #{order.id}')

    except Exception as e:
        logger.error(f'Failed to send sales notification email for order #{order.id}: {str(e)}')
        raise


def send_delivery_invoice_email(order):
    """
    Send a full invoice to the customer when order status changes to 'delivered'.
    """
    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        subtotal = float(order.total_amount) - float(getattr(order, 'delivery_cost', 0) or 0)

        subject = f'Votre facture PneuShop - Commande n°{order.order_number}'
        html_content = render_to_string('emails/delivery_invoice_email.html', {
            'order': order,
            'subtotal': subtotal,
            'frontend_url': frontend_url,
        })
        text_content = strip_tags(html_content)

        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'✅ Delivery invoice email sent to {order.user.email} for order #{order.id}')

    except Exception as e:
        logger.error(f'Failed to send delivery invoice email for order #{order.id}: {str(e)}')
        raise


def send_order_status_update_email(order, old_status=None):
    """
    Send email to customer when admin changes order status.
    Called on every status transition (confirmed, processing, shipped, delivered, cancelled).
    """
    STATUS_LABELS = {
        'confirmed': 'Confirmée',
        'processing': 'En cours de traitement',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée',
    }

    status_label = STATUS_LABELS.get(order.status, order.status)
    if order.status == 'pending':
        return  # Don't send for pending status

    try:
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        subtotal = float(order.total_amount) - float(getattr(order, 'delivery_cost', 0) or 0)

        subject = f'Mise à jour de votre commande n°{order.order_number} - {status_label}'
        html_content = render_to_string('emails/order_status_update.html', {
            'order': order,
            'status_label': status_label,
            'old_status': old_status,
            'subtotal': subtotal,
            'frontend_url': frontend_url,
        })
        text_content = strip_tags(html_content)

        send_mail(
            subject=subject,
            message=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html_content,
            fail_silently=False,
        )
        logger.info(f'✅ Status update email sent to {order.user.email} for order #{order.id} → {status_label}')

    except Exception as e:
        logger.error(f'Failed to send status update email for order #{order.id}: {str(e)}')
        raise


def send_support_message_notification_email(message):
    """
    Send notification to developer when a new support message is created.
    """
    PRIORITY_LABELS = {
        'low': 'Basse',
        'medium': 'Normale',
        'high': 'Haute',
        'urgent': 'URGENTE',
    }

    try:
        priority_label = PRIORITY_LABELS.get(message.priority, message.priority)
        developer_email = getattr(settings, 'DEVELOPER_EMAIL', getattr(settings, 'ADMIN_EMAIL', 'chathabahri55@gmail.com'))

        subject = f'[PneuShop] Nouveau message — Priorité {priority_label}'
        body = (
            f'Un employé vient de soumettre un nouveau message sur PneuShop.\n\n'
            f'Titre     : {message.title}\n'
            f'Priorité  : {priority_label}\n'
            f'Auteur    : {message.author.get_full_name() or message.author.email}\n'
            f'Date      : {message.created_at.strftime("%d/%m/%Y %H:%M")}\n\n'
            f'Contenu :\n{message.content}\n\n'
            f'---\n'
            f"Connectez-vous à l'interface admin pour répondre ou marquer comme traité."
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[developer_email],
            fail_silently=False,
        )
        logger.info(f'✅ Support notification sent to developer {developer_email} for message: {message.title}')

    except Exception as e:
        logger.error(f'Failed to send support notification for message {message.id}: {str(e)}')
        # Don't raise - support notifications should not block message creation
