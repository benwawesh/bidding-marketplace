import axios from './axios';

export const deleteAPI = {
  // Delete single product
  deleteProduct: (productId) => 
    axios.delete(`/api/auctions/${productId}/delete/`),
  
  // Bulk delete products
  bulkDelete: (productIds) => 
    axios.post('/api/auctions/bulk-delete/', {
      product_ids: productIds
    }),
};
