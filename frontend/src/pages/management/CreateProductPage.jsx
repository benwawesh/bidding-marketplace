import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI, categoriesAPI } from '../../api/endpoints';

export default function CreateProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data),
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    product_type: 'buy_now',
    base_price: '',
    buy_now_price: '',
    market_price: '',  // NEW FIELD
    participation_fee: '',
    stock_quantity: '',
    main_image: null,
    is_featured: false,
    is_flash_sale: false,
    discount_percentage: '',
    flash_sale_ends_at: '',
    display_order: 0,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  const createMutation = useMutation({
    mutationFn: (data) => auctionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-products']);
      alert('✅ Product created successfully!');
      navigate('/management/products');
    },
    onError: (error) => {
      console.log('=== FULL ERROR ===');
      console.log('Error object:', error);
      console.log('Response:', error.response);
      console.log('Response data:', error.response?.data);
      console.log('Response status:', error.response?.status);
      console.log('===================');
      
      const errorData = error.response?.data || {};
      setErrors(errorData);
      
      const errorMessages = Object.entries(errorData).map(([field, msgs]) => {
        return `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
      }).join('\n');
      
      alert('❌ Error creating product:\n\n' + (errorMessages || 'Unknown error'));
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB');
        return;
      }

      setFormData(prev => ({ ...prev, main_image: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      product_type: formData.product_type,
      base_price: parseFloat(formData.base_price) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      main_image: formData.main_image,
      is_featured: formData.is_featured,
      is_flash_sale: formData.is_flash_sale,
      display_order: parseInt(formData.display_order) || 0,
    };

    // Add market_price if provided
    if (formData.market_price) {
      payload.market_price = parseFloat(formData.market_price);
    }

    if (formData.product_type === 'buy_now' || formData.product_type === 'both') {
      payload.buy_now_price = parseFloat(formData.buy_now_price) || 0;
    }

    if (formData.product_type === 'auction' || formData.product_type === 'both') {
      payload.participation_fee = parseFloat(formData.participation_fee) || 0;
    }

    if (formData.is_flash_sale) {
      payload.discount_percentage = parseFloat(formData.discount_percentage) || 0;
      payload.flash_sale_ends_at = formData.flash_sale_ends_at;
    }

    createMutation.mutate(payload);
  };

  const showAuctionFields = formData.product_type === 'auction' || formData.product_type === 'both';
  const showBuyNowFields = formData.product_type === 'buy_now' || formData.product_type === 'both';

  return (
    <ManagementLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Product</h1>
          <p className="text-gray-600">Add a new product or auction to your marketplace</p>
          {showAuctionFields && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ℹ️ <strong>Auction Control:</strong> You'll manually activate and close this auction. No timing needed!
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Product Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Product Type *</label>
            <div className="grid grid-cols-3 gap-4">
              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'buy_now' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input type="radio" name="product_type" value="buy_now" checked={formData.product_type === 'buy_now'} onChange={handleChange} className="sr-only" />
                <span className="text-3xl mb-2">🛒</span>
                <span className="font-semibold text-gray-900">Buy Now</span>
                <span className="text-xs text-gray-600 mt-1">Fixed price purchase</span>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'auction' ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-red-400'
              }`}>
                <input type="radio" name="product_type" value="auction" checked={formData.product_type === 'auction'} onChange={handleChange} className="sr-only" />
                <span className="text-3xl mb-2">🎯</span>
                <span className="font-semibold text-gray-900">Auction</span>
                <span className="text-xs text-gray-600 mt-1">Manual control</span>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'both' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
              }`}>
                <input type="radio" name="product_type" value="both" checked={formData.product_type === 'both'} onChange={handleChange} className="sr-only" />
                <span className="text-3xl mb-2">⚡</span>
                <span className="font-semibold text-gray-900">Both</span>
                <span className="text-xs text-gray-600 mt-1">Buy or bid</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g., iPhone 15 Pro Max 256GB" required />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Describe your product..." required />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`} required>
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setFormData(prev => ({ ...prev, main_image: null })); setImagePreview(null); }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700">×</button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-gray-400 text-4xl">📷</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleFileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                    <p className="text-xs text-gray-500 mt-2">Upload JPG, PNG, or GIF (Max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Market Price - NEW FIELD (Jumia Style) */}
              <div className="col-span-2 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  🏷️ Market/Retail Price (KES) - <span className="text-yellow-700">Shown Crossed Out Like Jumia</span>
                </label>
                <input 
                  type="number" 
                  name="market_price" 
                  value={formData.market_price} 
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${errors.market_price ? 'border-red-500' : ''}`}
                  placeholder="e.g., 100000 (will show as KSh 100,000 ❌)" 
                  min="0" 
                  step="0.01" 
                />
                <p className="text-xs text-gray-600 mt-2">
                  💡 This is the original retail price shown with a strikethrough. Leave empty if not needed.
                </p>
                {errors.market_price && <p className="text-red-600 text-sm mt-1">{errors.market_price[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {showAuctionFields ? 'Starting Bid (KES) *' : 'Base Price (KES) *'}
                </label>
                <input type="number" name="base_price" value={formData.base_price} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.base_price ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="50000" min="0" step="0.01" required />
                {errors.base_price && <p className="text-red-600 text-sm mt-1">{errors.base_price[0]}</p>}
              </div>

              {showBuyNowFields && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Buy Now Price (KES) *</label>
                  <input type="number" name="buy_now_price" value={formData.buy_now_price} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.buy_now_price ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="75000" min="0" step="0.01" required={showBuyNowFields} />
                  {errors.buy_now_price && <p className="text-red-600 text-sm mt-1">{errors.buy_now_price[0]}</p>}
                </div>
              )}

              {showAuctionFields && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Participation Fee (KES) *</label>
                  <input type="number" name="participation_fee" value={formData.participation_fee} onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.participation_fee ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="500" min="0" step="0.01" required={showAuctionFields} />
                  {errors.participation_fee && <p className="text-red-600 text-sm mt-1">{errors.participation_fee[0]}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity *</label>
                <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.stock_quantity ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="10" min="0" required />
                {errors.stock_quantity && <p className="text-red-600 text-sm mt-1">{errors.stock_quantity[0]}</p>}
              </div>
            </div>
          </div>

          {/* Special Features */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Special Features</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="is_featured" checked={formData.is_featured} onChange={handleChange} className="w-5 h-5 text-red-600" />
                <div>
                  <span className="font-semibold text-gray-900">Featured Product</span>
                  <p className="text-sm text-gray-600">Display in hero carousel on homepage</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" name="is_flash_sale" checked={formData.is_flash_sale} onChange={handleChange} className="w-5 h-5 text-red-600" />
                <div>
                  <span className="font-semibold text-gray-900">Flash Sale</span>
                  <p className="text-sm text-gray-600">Add discount badge and urgency</p>
                </div>
              </label>

              {formData.is_flash_sale && (
                <div className="ml-8 grid grid-cols-2 gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Discount Percentage</label>
                    <input type="number" name="discount_percentage" value={formData.discount_percentage} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="20" min="0" max="100" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Flash Sale Ends At</label>
                    <input type="datetime-local" name="flash_sale_ends_at" value={formData.flash_sale_ends_at} onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Order</label>
                <input type="number" name="display_order" value={formData.display_order} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0" min="0" />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (0 = default)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button type="submit" disabled={createMutation.isPending}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
              {createMutation.isPending ? 'Creating...' : '✅ Create Product'}
            </button>
            
            <button type="button" onClick={() => navigate('/management')}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </ManagementLayout>
  );
}
