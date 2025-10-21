import axios from './axios';

export const deleteAPI = {
  // Delete single product
  deleteProduct: (productId) => 
    axios.delete(`http://127.0.0.1:8000/api/auctions/${productId}/delete/`),
  
  // Bulk delete products
  bulkDelete: (productIds) => 
    axios.post('http://127.0.0.1:8000/api/auctions/bulk-delete/', {
      product_ids: productIds
    }),
};
