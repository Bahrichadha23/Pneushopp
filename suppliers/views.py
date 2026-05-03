from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from django.db.models import ProtectedError

from accounts.permanent_permissions import IsAdminOrPurchasing
from .models import Supplier
from .serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrPurchasing]

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError as e:
            protected_count = len(e.protected_objects)
            return Response(
                {'error': f"Impossible de supprimer ce fournisseur car il est lié à {protected_count} bon(s) d'achat. Supprimez ou réaffectez ces achats avant de supprimer le fournisseur."},
                status=status.HTTP_400_BAD_REQUEST,
            )
