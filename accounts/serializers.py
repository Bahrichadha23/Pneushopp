from rest_framework import serializers
from .models import CustomUser


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'address']

    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError('Les mots de passe ne correspondent pas.')
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Email ou mot de passe incorrect.')
        if not user.is_active:
            raise serializers.ValidationError('Compte désactivé.')
        return {'user': user}


class UserSerializer(serializers.ModelSerializer):
    firstName = serializers.SerializerMethodField()
    lastName = serializers.SerializerMethodField()
    telephone = serializers.SerializerMethodField()
    adresse = serializers.SerializerMethodField()
    dateInscription = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    totalCommandes = serializers.SerializerMethodField()
    montantTotal = serializers.SerializerMethodField()
    derniereCommande = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'firstName', 'lastName', 'phone', 'address',
            'telephone', 'adresse', 'is_verified', 'role',
            'dateInscription', 'type', 'totalCommandes',
            'montantTotal', 'derniereCommande', 'is_staff', 'is_superuser',
        ]

    def get_telephone(self, obj):
        return getattr(obj, 'phone', '')

    def get_adresse(self, obj):
        return getattr(obj, 'address', '')

    def get_dateInscription(self, obj):
        if obj.date_joined:
            return obj.date_joined.strftime('%d/%m/%Y')
        return ''

    def get_type(self, obj):
        return 'particulier'

    def get_totalCommandes(self, obj):
        return getattr(obj, 'user_orders', obj.order_set if hasattr(obj, 'order_set') else None) and \
               getattr(obj, 'user_orders', obj.order_set if hasattr(obj, 'order_set') else None).count() or 0

    def get_montantTotal(self, obj):
        try:
            orders = obj.user_orders.all() if hasattr(obj, 'user_orders') else []
            return sum(float(o.total_amount or 0) for o in orders)
        except Exception:
            return 0

    def get_derniereCommande(self, obj):
        try:
            orders = obj.user_orders.order_by('-created_at') if hasattr(obj, 'user_orders') else []
            last = orders.first()
            if last:
                return last.created_at.strftime('%d/%m/%Y')
        except Exception:
            pass
        return 'Aucune'

    def get_firstName(self, obj):
        """Extract first name from username or email"""
        if obj.first_name:
            return obj.first_name
        return obj.email.split('@')[0]

    def get_lastName(self, obj):
        """Extract last name from username or email"""
        return obj.last_name or ''

    def get_role(self, obj):
        if obj.is_superuser:
            return 'admin'
        role = getattr(obj, 'role', 'customer')
        if role in ('admin', 'sales', 'purchasing', 'responsable_achats'):
            return role
        return 'customer'
