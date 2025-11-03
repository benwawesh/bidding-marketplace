import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI } from '../../api/endpoints';
import { deleteAPI } from '../../api/deleteAPI';
import { formatCurrency } from '../../utils/helpers';
import axios from '../../api/axios';
import toast from 'react-hot-toast';

export default function AllProductsPage() {
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'single' | 'bulk', data: id or ids }

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => auctionsAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (productId) =>
      axios.post(`/auctions/${productId}/activate/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success('✅ Product activated successfully!');
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to activate product';
      toast.error(`❌ ${message}`);
    },
  });

  // Delete single product mutation
  const deleteSingleMutation = useMutation({
    mutationFn: (productId) => deleteAPI.deleteProduct(productId),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(response.data.message);
      if (response.data.warnings?.length > 0) {
        toast.error('⚠️ ' + response.data.warnings.join(', '), { duration: 5000 });
      }
      setShowDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete product';
      toast.error(message);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (productIds) => deleteAPI.bulkDelete(productIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['admin-products']);
      toast.success(response.data.message);
      if (response.data.warnings?.length > 0) {
        toast.error('⚠️ ' + response.data.warnings.join(', '), { duration: 5000 });
      }
      setSelectedProducts([]);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Failed to delete products';
      toast.error(message);
    },
  });

  const handleActivate = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to activate this product?')) {
      activateMutation.mutate(productId);
    }
  };

  // Handle checkbox selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  // Open delete confirmation
  const openDeleteModal = (type, data) => {
    setDeleteTarget({ type, data });
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'single') {
      deleteSingleMutation.mutate(deleteTarget.data);
    } else if (deleteTarget.type === 'bulk') {
      bulkDeleteMutation.mutate(deleteTarget.data);
    }
  };

  // Get product details for delete modal
  const getDeleteDetails = () => {
    if (!deleteTarget) return null;
    
    if (deleteTarget.type === 'single') {
      const product = products.find(p => p.id === deleteTarget.data);
      return {
        count: 1,
        products: product ? [product] : [],
      };
    } else {
      const selectedProductsList = products.filter(p => deleteTarget.data.includes(p.id));
      return {
        count: selectedProductsList.length,
        products: selectedProductsList,
      };
    }
  };

  const deleteDetails = getDeleteDetails();

  // Filter states
  const activeProducts = products.filter(p => p.status === 'active');
  const draftProducts = products.filter(p => p.status === 'draft');
  const closedProducts = products.filter(p => p.status === 'closed');

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">All Products</h1>
            <p className="text-gray-600">Manage your products and auctions</p>
          </div>
          <div className="flex gap-3">
            {selectedProducts.length > 0 && (
              <button
                onClick={() => openDeleteModal('bulk', selectedProducts)}
                className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2"
              >
                🗑️ Delete Selected ({selectedProducts.length})
              </button>
            )}
            <Link
              to="/management/products/new"
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
            >
              ➕ Create Product
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Active</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{activeProducts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Draft</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{draftProducts.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Closed</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{closedProducts.length}</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Yet</h3>
              <p className="text-gray-600 mb-6">Create your first product to get started</p>
              <Link
                to="/management/products/new"
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 inline-block font-semibold"
              >
                ➕ Create First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <Link to={`/management/products/${product.id}`} className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {product.main_image ? (
                              <img 
                                src={product.main_image.startsWith('http') 
                                  ? product.main_image 
                                  : `${product.main_image}`
                                } 
                                alt={product.title} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                📷
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 hover:text-red-600">{product.title}</p>
                            <p className="text-sm text-gray-500">{product.category_name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.product_type === 'auction' ? 'bg-red-100 text-red-700' :
                          product.product_type === 'buy_now' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {product.product_type === 'buy_now' ? 'Buy Now' : 
                           product.product_type === 'auction' ? 'Auction' : 'Both'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(product.base_price)}
                        </p>
                        {product.buy_now_price && product.product_type !== 'auction' && (
                          <p className="text-xs text-gray-500">
                            Buy: {formatCurrency(product.buy_now_price)}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-gray-900">{product.stock_quantity}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(product.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/management/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View
                          </Link>
                          {product.status === 'draft' && (
                            <button 
                              onClick={(e) => handleActivate(e, product.id)}
                              disabled={activateMutation.isPending}
                              className="text-green-600 hover:text-green-700 font-medium text-sm disabled:text-gray-400"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openDeleteModal('single', product.id);
                            }}
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  ⚠️ Confirm Deletion
                </h2>
              </div>

              <div className="p-6">
                <p className="text-gray-900 mb-4">
                  You are about to <strong className="text-red-600">permanently delete {deleteDetails.count} product{deleteDetails.count > 1 ? 's' : ''}</strong>. This action cannot be undone.
                </p>

                {/* Products to be deleted */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Products to be deleted:</h3>
                  <ul className="space-y-2">
                    {deleteDetails.products.map(product => (
                      <li key={product.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {product.main_image && (
                            <img 
                              src={product.main_image.startsWith('http') 
                                ? product.main_image 
                                : `${product.main_image}`
                              }
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-600">
                            {product.product_type === 'buy_now' ? '🛒 Buy Now' : 
                             product.product_type === 'auction' ? '🎯 Auction' : '⚡ Both'} 
                            {' • '}
                            <span className="capitalize">{product.status}</span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Warning for auction products */}
                {deleteDetails.products.some(p => p.product_type === 'auction' || p.product_type === 'both') && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 font-semibold mb-1">⚠️ Warning:</p>
                    <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                      <li>All bids associated with auction products will be deleted</li>
                      <li>Participants will lose access to these auctions</li>
                      <li>This action is permanent and cannot be undone</li>
                    </ul>
                  </div>
                )}

                {/* Warning for buy_now products with orders */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 font-semibold mb-1">ℹ️ Note:</p>
                  <p className="text-sm text-blue-700">
                    Existing order records will be preserved for bookkeeping, but will no longer reference this product.
                  </p>
                </div>

                <p className="text-gray-900 font-semibold mb-2">
                  Are you absolutely sure you want to continue?
                </p>
              </div>

              <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={deleteSingleMutation.isPending || bulkDeleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteSingleMutation.isPending || bulkDeleteMutation.isPending}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400 flex items-center gap-2"
                >
                  {(deleteSingleMutation.isPending || bulkDeleteMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      🗑️ Yes, Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
