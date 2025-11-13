import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { auctionsAPI, categoriesAPI } from '../../api/endpoints';
import axios from '../../api/axios';

export default function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => auctionsAPI.getById(id).then(res => res.data),
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    product_type: 'buy_now',
    base_price: '',
    buy_now_price: '',
    participation_fee: '',
    stock_quantity: '',
    main_image: null,
    background_music: null,
    start_time: '',
    end_time: '',
    is_featured: false,
    is_flash_sale: false,
    discount_percentage: '',
    flash_sale_ends_at: '',
    display_order: 0,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [musicFileName, setMusicFileName] = useState('');
  const [musicPreviewUrl, setMusicPreviewUrl] = useState(null);
  const [errors, setErrors] = useState({});
  const [keepExistingImage, setKeepExistingImage] = useState(true);
  const [keepExistingMusic, setKeepExistingMusic] = useState(true);

  // Populate form when product loads
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || '',
        description: product.description || '',
        category: product.category || '',
        product_type: product.product_type || 'buy_now',
        base_price: product.base_price || '',
        buy_now_price: product.buy_now_price || '',
        participation_fee: product.participation_fee || '',
        stock_quantity: product.stock_quantity || '',
        main_image: null,
        background_music: null,
        start_time: product.start_time ? new Date(product.start_time).toISOString().slice(0, 16) : '',
        end_time: product.end_time ? new Date(product.end_time).toISOString().slice(0, 16) : '',
        is_featured: product.is_featured || false,
        is_flash_sale: product.is_flash_sale || false,
        discount_percentage: product.discount_percentage || '',
        flash_sale_ends_at: product.flash_sale_ends_at ? new Date(product.flash_sale_ends_at).toISOString().slice(0, 16) : '',
        display_order: product.display_order || 0,
      });

      // Set existing image preview
      if (product.main_image) {
        const imageUrl = product.main_image.startsWith('http')
          ? product.main_image
          : `${product.main_image}`;
        setImagePreview(imageUrl);
      }

      // Set existing music file name and URL
      if (product.background_music) {
        const fileName = product.background_music.split('/').pop();
        setMusicFileName(fileName);
        const musicUrl = product.background_music.startsWith('http')
          ? product.background_music
          : `${product.background_music}`;
        setMusicPreviewUrl(musicUrl);
      }
    }
  }, [product]);

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: (data) => {
      // If there's a file (image or music), use FormData
      if (data.main_image instanceof File || data.background_music instanceof File) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            formData.append(key, data[key]);
          }
        });
        return axios.put(`/auctions/${id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      // Otherwise send JSON
      return axios.put(`/auctions/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['product', id]);
      queryClient.invalidateQueries(['admin-products']);
      alert('✅ Product updated successfully!');
      navigate(`/management/products/${id}`);
    },
    onError: (error) => {
      const errorData = error.response?.data || {};
      setErrors(errorData);
      alert('❌ Error updating product. Check the form for errors.');
      console.error('Update error:', errorData);
    },
  });

  // Handle input change
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

  // Handle file input
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
      setKeepExistingImage(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle music file input
  const handleMusicFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please select an audio file (MP3, WAV, OGG, etc.)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Audio file must be less than 10MB');
        return;
      }

      setFormData(prev => ({ ...prev, background_music: file }));
      setKeepExistingMusic(false);
      setMusicFileName(file.name);

      // Create preview URL for the audio file
      const previewUrl = URL.createObjectURL(file);
      setMusicPreviewUrl(previewUrl);
    }
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      product_type: formData.product_type,
      base_price: parseFloat(formData.base_price) || 0,
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      is_featured: formData.is_featured,
      is_flash_sale: formData.is_flash_sale,
      display_order: parseInt(formData.display_order) || 0,
    };

    // Only include new image if user uploaded one
    if (formData.main_image instanceof File) {
      payload.main_image = formData.main_image;
    }

    // Only include new music if user uploaded one
    if (formData.background_music instanceof File) {
      payload.background_music = formData.background_music;
    }

    if (formData.product_type === 'buy_now' || formData.product_type === 'both') {
      payload.buy_now_price = parseFloat(formData.buy_now_price) || 0;
    }

    if (formData.product_type === 'auction' || formData.product_type === 'both') {
      payload.participation_fee = parseFloat(formData.participation_fee) || 0;
      payload.start_time = formData.start_time;
      payload.end_time = formData.end_time;
    }

    if (formData.is_flash_sale) {
      payload.discount_percentage = parseFloat(formData.discount_percentage) || 0;
      payload.flash_sale_ends_at = formData.flash_sale_ends_at;
    }

    updateMutation.mutate(payload);
  };

  const showAuctionFields = formData.product_type === 'auction' || formData.product_type === 'both';
  const showBuyNowFields = formData.product_type === 'buy_now' || formData.product_type === 'both';

  if (productLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </ManagementLayout>
    );
  }

  if (!product) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <p className="text-red-600 text-xl">Product not found</p>
          <Link to="/management/products" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Products
          </Link>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link to={`/management/products/${id}`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            ← Back to Product
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Product</h1>
          <p className="text-gray-600">Update product information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          
          {/* Product Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Product Type *</label>
            <div className="grid grid-cols-3 gap-4">
              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'buy_now' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              }`}>
                <input
                  type="radio"
                  name="product_type"
                  value="buy_now"
                  checked={formData.product_type === 'buy_now'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">🛒</span>
                <span className="font-semibold text-gray-900">Buy Now</span>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'auction' ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-red-400'
              }`}>
                <input
                  type="radio"
                  name="product_type"
                  value="auction"
                  checked={formData.product_type === 'auction'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">🎯</span>
                <span className="font-semibold text-gray-900">Auction</span>
              </label>

              <label className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                formData.product_type === 'both' ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'
              }`}>
                <input
                  type="radio"
                  name="product_type"
                  value="both"
                  checked={formData.product_type === 'both'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="text-3xl mb-2">⚡</span>
                <span className="font-semibold text-gray-900">Both</span>
              </label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title[0]}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description[0]}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category[0]}</p>}
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Image
                </label>

                <div className="flex items-start gap-4">
                  {/* Image Preview */}
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        {formData.main_image instanceof File && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, main_image: null }));
                              setKeepExistingImage(true);
                              // Restore original image
                              if (product.main_image) {
                                const imageUrl = product.main_image.startsWith('http')
                                  ? product.main_image
                                  : `${product.main_image}`;
                                setImagePreview(imageUrl);
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <span className="text-gray-400 text-4xl">📷</span>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Upload new image (JPG, PNG, or GIF - Max 5MB) or keep existing
                    </p>
                  </div>
                </div>
              </div>

              {/* Background Music Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Background Music (Optional) 🎵
                </label>

                <div className="space-y-3">
                  {/* Music Preview Player */}
                  {musicPreviewUrl && (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🎵</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {formData.background_music instanceof File ? 'New: ' : 'Current: '}
                            {musicFileName}
                          </p>
                          <p className="text-xs text-gray-600">Preview your music below</p>
                        </div>
                        {formData.background_music instanceof File && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, background_music: null }));
                              setKeepExistingMusic(true);
                              setMusicFileName(product?.background_music ? product.background_music.split('/').pop() : '');
                              setMusicPreviewUrl(product?.background_music ? (product.background_music.startsWith('http') ? product.background_music : `${product.background_music}`) : null);
                            }}
                            className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Audio Player */}
                      <audio
                        controls
                        src={musicPreviewUrl}
                        className="w-full"
                        style={{ height: '40px' }}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Current Music Display (when no preview URL yet) */}
                  {musicFileName && keepExistingMusic && !musicPreviewUrl && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-2xl">🎵</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Current: {musicFileName}</p>
                        <p className="text-xs text-gray-600">Playing on auction page</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, background_music: null }));
                          setKeepExistingMusic(true);
                          setMusicFileName(product?.background_music ? product.background_music.split('/').pop() : '');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Keep
                      </button>
                    </div>
                  )}

                  {/* File Input */}
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleMusicFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-xs text-gray-500">
                    Upload background music (MP3, WAV, OGG - Max 10MB). Music will auto-play on auction detail page.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {showAuctionFields ? 'Starting Bid (KES) *' : 'Base Price (KES) *'}
                </label>
                <input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.base_price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                  required
                />
                {errors.base_price && <p className="text-red-600 text-sm mt-1">{errors.base_price[0]}</p>}
              </div>

              {showBuyNowFields && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Buy Now Price (KES) *
                  </label>
                  <input
                    type="number"
                    name="buy_now_price"
                    value={formData.buy_now_price}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.buy_now_price ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required={showBuyNowFields}
                  />
                  {errors.buy_now_price && <p className="text-red-600 text-sm mt-1">{errors.buy_now_price[0]}</p>}
                </div>
              )}

              {showAuctionFields && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Participation Fee (KES) *
                  </label>
                  <input
                    type="number"
                    name="participation_fee"
                    value={formData.participation_fee}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.participation_fee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required={showAuctionFields}
                  />
                  {errors.participation_fee && <p className="text-red-600 text-sm mt-1">{errors.participation_fee[0]}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock_quantity"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  required
                />
                {errors.stock_quantity && <p className="text-red-600 text-sm mt-1">{errors.stock_quantity[0]}</p>}
              </div>
            </div>
          </div>

          {/* Auction Timing */}
          {showAuctionFields && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Auction Timing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.start_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={showAuctionFields}
                  />
                  {errors.start_time && <p className="text-red-600 text-sm mt-1">{errors.start_time[0]}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.end_time ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={showAuctionFields}
                  />
                  {errors.end_time && <p className="text-red-600 text-sm mt-1">{errors.end_time[0]}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Special Features */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Special Features</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600"
                />
                <div>
                  <span className="font-semibold text-gray-900">Featured Product</span>
                  <p className="text-sm text-gray-600">Display in hero carousel on homepage</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="is_flash_sale"
                  checked={formData.is_flash_sale}
                  onChange={handleChange}
                  className="w-5 h-5 text-red-600"
                />
                <div>
                  <span className="font-semibold text-gray-900">Flash Sale</span>
                  <p className="text-sm text-gray-600">Add discount badge and urgency</p>
                </div>
              </label>

              {formData.is_flash_sale && (
                <div className="ml-8 grid grid-cols-2 gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Percentage
                    </label>
                    <input
                      type="number"
                      name="discount_percentage"
                      value={formData.discount_percentage}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Flash Sale Ends At
                    </label>
                    <input
                      type="datetime-local"
                      name="flash_sale_ends_at"
                      value={formData.flash_sale_ends_at}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (0 = default)</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? 'Updating...' : '✅ Update Product'}
            </button>
            
            <Link
              to={`/management/products/${id}`}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </ManagementLayout>
  );
}
