#!/bin/bash

# Django Backend Setup Script for PNEU SHOP

echo "🔧 Setting up Django Backend for PNEU SHOP..."

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗃️ Setting up database..."
python manage.py makemigrations
python manage.py migrate

echo "👤 Creating superuser..."
echo "Please create a superuser account for Django admin:"
python manage.py createsuperuser

echo "🌱 Loading initial data (optional)..."
if [ -f "fixtures/initial_data.json" ]; then
    python manage.py loaddata fixtures/initial_data.json
else
    echo "ℹ️ No fixtures found. You can add initial data manually through Django admin."
fi

echo "✅ Django backend setup complete!"
echo ""
echo "🚀 To start the Django development server:"
echo "   cd backend"
echo "   python manage.py runserver"
echo ""
echo "📊 Django Admin will be available at: http://localhost:8000/admin/"
echo "🔗 API will be available at: http://localhost:8000/api/"