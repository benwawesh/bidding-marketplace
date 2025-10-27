# Replace the perform_create method in AuctionViewSet (around line 108)

def perform_create(self, serializer):
    """Set the creator when creating auction"""
    # Allow superusers and sellers to create products
    if not (self.request.user.user_type == 'seller' or self.request.user.is_superuser):
        raise PermissionError("Only sellers and admins can create products")
    serializer.save(created_by=self.request.user)
