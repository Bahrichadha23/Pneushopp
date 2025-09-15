# PNEU SHOP - Frontend & Backend Integration

This project integrates a Next.js frontend with a Django REST API backend for the PNEU SHOP e-commerce platform.

## 🏗️ Project Structure

```
pneushopclone/
├── 🎨 Frontend (Next.js)
│   ├── app/                    # Next.js 13+ app directory
│   ├── components/            # React components
│   ├── contexts/              # React contexts (Auth, Cart, etc.)
│   ├── lib/                   # Utilities and API client
│   │   ├── api-client.ts      # Axios configuration
│   │   └── services/          # API service layer
│   ├── types/                 # TypeScript type definitions
│   └── .env.local             # Environment variables
│
└── 🔧 Backend (Django)
    ├── manage.py
    ├── pneushop/              # Django project settings
    ├── accounts/              # User authentication
    ├── products/              # Product management
    ├── cart/                  # Shopping cart
    └── favorites/             # User favorites
```

## 🚀 Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: http://localhost:3000

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Setup database
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Django server
python manage.py runserver
```

The backend API will be available at: http://localhost:8000/api/

## 🔗 API Integration

The frontend connects to the Django backend through:

### API Client Configuration
- **Base URL**: `http://localhost:8000/api`
- **Authentication**: JWT tokens (stored in localStorage)
- **Auto token refresh**: Handles token expiration automatically

### Available Services

#### Authentication (`lib/services/auth.ts`)
- Login/Register
- Profile management
- Token handling

#### Products (`lib/services/products.ts`)
- Product listing with filters
- Product search
- Product CRUD (admin)

#### Cart (`lib/services/cart.ts`)
- Add/remove items
- Update quantities
- Cart persistence

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/token/` | POST | User login |
| `/api/auth/register/` | POST | User registration |
| `/api/auth/user/` | GET/PATCH | User profile |
| `/api/products/` | GET/POST | Products list/create |
| `/api/products/{id}/` | GET/PATCH/DELETE | Product detail |
| `/api/cart/` | GET/POST/DELETE | Cart management |
| `/api/favorites/` | GET/POST | Favorites |

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the root directory:

```env
# Django Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_DJANGO_URL=http://localhost:8000

# Frontend Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Development
NODE_ENV=development
```

### Django Settings

Update `backend/pneushop/settings.py`:

```python
# Security - Use environment variables in production
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key')
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# Database - Configure for your environment
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'pneushop_db'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'your_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# CORS - Allow frontend to connect
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

## 🔐 Authentication Flow

1. **User Registration/Login**: Frontend sends credentials to Django
2. **Token Response**: Django returns JWT access/refresh tokens
3. **Token Storage**: Frontend stores tokens in localStorage
4. **Authenticated Requests**: Axios automatically adds Bearer token
5. **Token Refresh**: Auto-refresh expired tokens

## 🛠️ Development

### Running Both Servers

**Terminal 1 - Django Backend:**
```bash
cd backend
python manage.py runserver
```

**Terminal 2 - Next.js Frontend:**
```bash
npm run dev
```

### TypeScript Support

The project includes full TypeScript support with:
- Type definitions in `types/` directory
- Strict type checking
- API response typing

### Error Handling

- Comprehensive error handling in API services
- User-friendly error messages
- Automatic token refresh on 401 errors

## 📚 Key Features Integrated

✅ **User Authentication**
- JWT-based authentication
- User registration and login
- Profile management

✅ **Product Management**
- Product listing with pagination
- Search and filtering
- Admin product CRUD

✅ **Shopping Cart**
- Add/remove items
- Quantity updates
- Cart persistence

✅ **Security**
- CORS configuration
- JWT token management
- Environment-based configuration

## 🚨 Security Notes

**For Production:**

1. **Environment Variables**: Never commit secrets to git
2. **Django Settings**: Use environment variables for sensitive data
3. **HTTPS**: Enable HTTPS for both frontend and backend
4. **Database**: Use a secure database configuration
5. **CORS**: Restrict CORS origins to your domain

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure Django CORS settings include your frontend URL
- Check that both servers are running

**Authentication Issues:**
- Verify JWT settings in Django
- Check token storage in browser dev tools

**API Connection:**
- Confirm backend is running on port 8000
- Check API_BASE_URL in environment variables

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 📞 Support

If you encounter issues:
1. Check console for error messages
2. Verify both servers are running
3. Check network tab for failed API calls
4. Review Django logs for backend errors