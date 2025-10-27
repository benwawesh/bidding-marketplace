from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Auction, Bid, Participation, CartItem, OrderItem
from django.db import transaction


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_product(request, product_id):
    """Delete a single product (hard delete)"""
    
    # Check admin permissions
    if not request.user.is_superuser and request.user.user_type != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        product = get_object_or_404(Auction, id=product_id)
        product_title = product.title
        
        # Check if product has been ordered
        order_items = OrderItem.objects.filter(product=product)
        has_orders = order_items.exists()
        
        with transaction.atomic():
            # Delete related data
            Bid.objects.filter(auction=product).delete()
            Participation.objects.filter(auction=product).delete()
            CartItem.objects.filter(product=product).delete()
            
            # Handle OrderItems - set product to NULL instead of deleting
            # This preserves order history while allowing product deletion
            if has_orders:
                order_items.update(product=None)
            
            # Delete the product itself
            product.delete()
            
        message = f'Product "{product_title}" deleted successfully'
        if has_orders:
            message += f' (Product was in {order_items.count()} orders - order records preserved)'
        
        return Response({
            'message': message,
            'had_orders': has_orders
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        print(f"Delete error: {str(e)}")
        print(traceback.format_exc())  # Full error trace
        return Response({
            'error': f'Failed to delete product: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_delete_products(request):
    """Delete multiple products (hard delete)"""
    
    # Check admin permissions
    if not request.user.is_superuser and request.user.user_type != 'admin':
        return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    
    product_ids = request.data.get('product_ids', [])
    
    if not product_ids:
        return Response({'error': 'No products selected'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        products = Auction.objects.filter(id__in=product_ids)
        
        if not products.exists():
            return Response({'error': 'No products found'}, status=status.HTTP_404_NOT_FOUND)
        
        deleted_count = 0
        deleted_titles = []
        total_orders_affected = 0
        
        with transaction.atomic():
            for product in products:
                # Check if product has been ordered
                order_items = OrderItem.objects.filter(product=product)
                if order_items.exists():
                    total_orders_affected += order_items.count()
                    order_items.update(product=None)
                
                # Delete related data
                Bid.objects.filter(auction=product).delete()
                Participation.objects.filter(auction=product).delete()
                CartItem.objects.filter(product=product).delete()
                
                deleted_titles.append(product.title)
                product.delete()
                deleted_count += 1
            
        message = f'{deleted_count} products deleted successfully'
        if total_orders_affected > 0:
            message += f' ({total_orders_affected} order records preserved)'
        
        return Response({
            'message': message,
            'deleted_products': deleted_titles,
            'orders_affected': total_orders_affected
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        print(f"Bulk delete error: {str(e)}")
        print(traceback.format_exc())
        return Response({
            'error': f'Failed to delete products: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
