import axios from './axios';

export const deleteAPI = {
  // Delete single product
  deleteProduct: (productId) =>
    axios.delete(`/auctions/${productId}/delete/`),

  // Bulk delete products
  bulkDelete: (productIds) =>
    axios.post('/auctions/bulk-delete/', {
      product_ids: productIds
    }),
};
