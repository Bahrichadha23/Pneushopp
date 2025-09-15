#!/usr/bin/env python3
"""
Email Functionality Demo Script
PneuShop - Academic Project

This script demonstrates the complete email workflow:
1. User registration with welcome email
2. Password reset with secure token
3. Email templates rendering

For academic/student demonstration purposes only.
"""

import os
import sys
import django
import json
from datetime import datetime

# Add the project to Python path
sys.path.append('/media/talha/New Volume/Freelance/Ahmad Faizan/DJango Work/pneushopclone/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pneushop.settings')
django.setup()

from accounts.models import CustomUser
from accounts.email_utils import send_welcome_email, send_password_reset_email
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

def demo_welcome_email():
    """Demonstrate welcome email functionality"""
    print("=" * 60)
    print("🎉 WELCOME EMAIL DEMO")
    print("=" * 60)
    
    # Get a test user (or create one)
    try:
        user = CustomUser.objects.get(email='test@example.com')
        print(f"📧 Using existing user: {user.email}")
    except CustomUser.DoesNotExist:
        print("❌ Test user not found. Please register a user first.")
        return
    
    # Send welcome email
    success = send_welcome_email(user)
    if success:
        print("✅ Welcome email sent successfully!")
        print("📨 Check the Django console output to see the email content")
    else:
        print("❌ Failed to send welcome email")
    
    print()

def demo_password_reset():
    """Demonstrate password reset functionality"""
    print("=" * 60)
    print("🔐 PASSWORD RESET DEMO")
    print("=" * 60)
    
    # Get a test user
    try:
        user = CustomUser.objects.get(email='test@example.com')
        print(f"🔧 Generating password reset for: {user.email}")
    except CustomUser.DoesNotExist:
        print("❌ Test user not found. Please register a user first.")
        return
    
    # Generate secure token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    reset_url = f"http://localhost:3000/auth/reset-password?uid={uid}&token={token}"
    
    print(f"🔑 Generated UID: {uid}")
    print(f"🔑 Generated Token: {token}")
    print(f"🔗 Reset URL: {reset_url}")
    
    # Send password reset email
    success = send_password_reset_email(user, reset_url, token, "192.168.1.100")
    if success:
        print("✅ Password reset email sent successfully!")
        print("📨 Check the Django console output to see the email content")
    else:
        print("❌ Failed to send password reset email")
    
    print()

def show_email_templates():
    """Show information about email templates"""
    print("=" * 60)
    print("📄 EMAIL TEMPLATES INFO")
    print("=" * 60)
    
    templates = [
        {
            "name": "Welcome Email",
            "file": "templates/emails/welcome_email.html",
            "description": "Sent when a new user registers",
            "features": ["Professional branding", "Account features overview", "Call-to-action buttons"]
        },
        {
            "name": "Password Reset Email", 
            "file": "templates/emails/password_reset_email.html",
            "description": "Sent when user requests password reset",
            "features": ["Secure token link", "Security warnings", "Expiration notice"]
        }
    ]
    
    for template in templates:
        print(f"📧 {template['name']}")
        print(f"   📁 File: {template['file']}")
        print(f"   📝 Description: {template['description']}")
        print(f"   ✨ Features: {', '.join(template['features'])}")
        print()

def main():
    """Main demo function"""
    print()
    print("🛞 PNEU SHOP - EMAIL SYSTEM DEMO")
    print("Academic Project - Email Functionality Showcase")
    print("=" * 60)
    print(f"📅 Demo Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Show templates info
    show_email_templates()
    
    # Demo welcome email
    demo_welcome_email()
    
    # Demo password reset
    demo_password_reset()
    
    print("=" * 60)
    print("✅ EMAIL DEMO COMPLETED")
    print("💡 Note: Emails are displayed in the Django console since we're using")
    print("    console email backend for development/academic purposes.")
    print("💡 In production, configure SMTP settings to send real emails.")
    print("=" * 60)
    print()

if __name__ == "__main__":
    main()