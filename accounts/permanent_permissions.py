from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'role', None) == 'admin' or request.user.is_superuser)
        )


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'manager'
        )


class IsPurchasing(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) in ('purchasing', 'responsable_achats')
        )


class IsSales(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'role', None) == 'sales'
        )


class IsAdminOrPurchasing(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_superuser or
                getattr(request.user, 'role', None) in ('admin', 'purchasing', 'responsable_achats')
            )
        )


class IsAdminOrSales(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (
                request.user.is_superuser or
                getattr(request.user, 'role', None) in ('admin', 'sales')
            )
        )
