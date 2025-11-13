import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ManagementLayout from '../../components/layout/ManagementLayout';
import toast from 'react-hot-toast';
import axios from '../../api/axios';

export default function HeroBannersPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch hero banners
  const { data, isLoading } = useQuery({
    queryKey: ['hero-banners'],
    queryFn: async () => {
      const res = await axios.get('/hero-banners/');
      // Handle paginated response
      if (res.data.results && Array.isArray(res.data.results)) {
        return res.data.results;
      }
      // Handle direct array response
      if (Array.isArray(res.data)) {
        return res.data;
      }
      // Fallback to empty array
      return [];
    },
  });

  const banners = Array.isArray(data) ? data : [];

  // Create banner mutation
  const createMutation = useMutation({
    mutationFn: (formData) => axios.post('/hero-banners/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['hero-banners']);
      toast.success('✅ Hero banner created successfully!');
      setShowCreateModal(false);
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create banner');
    },
  });

  // Update banner mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => axios.put(`/hero-banners/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['hero-banners']);
      toast.success('✅ Hero banner updated successfully!');
      setEditingBanner(null);
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update banner');
    },
  });

  // Delete banner mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axios.delete(`/hero-banners/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['hero-banners']);
      toast.success('✅ Hero banner deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete banner');
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => {
      const formData = new FormData();
      formData.append('is_active', is_active);
      return axios.patch(`/hero-banners/${id}/`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['hero-banners']);
      toast.success('✅ Banner status updated!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    formData.append('title', form.title.value);
    formData.append('subtitle', form.subtitle.value);
    formData.append('cta_text', form.cta_text.value);
    formData.append('cta_link', form.cta_link.value);
    formData.append('order', form.order.value || 0);
    formData.append('is_active', form.is_active.checked);

    // Only append image if a new one was selected
    if (form.image.files[0]) {
      formData.append('image', form.image.files[0]);
    }

    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hero banners...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hero Banners Management</h1>
            <p className="text-gray-600">Manage the carousel images displayed on your homepage</p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setEditingBanner(null);
              setImagePreview(null);
            }}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center gap-2"
          >
            <span className="text-xl">➕</span>
            Add New Banner
          </button>
        </div>

        {/* Banners List */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">🖼️</span>
            Current Banners ({banners.length})
          </h2>

          {banners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">🏞️</p>
              <p>No hero banners yet. Click "Add New Banner" to create one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border border-gray-300 rounded-lg p-4 flex gap-4">
                  {/* Image Preview */}
                  <div className="w-48 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {banner.image_url || banner.image ? (
                      <img
                        src={banner.image_url || banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                        <p className="text-sm text-gray-600">{banner.subtitle}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {banner.is_active ? '✓ Active' : '○ Inactive'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">CTA:</span> {banner.cta_text} → {banner.cta_link}
                      <span className="ml-4 font-medium">Order:</span> {banner.order}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBanner(banner);
                          setShowCreateModal(true);
                          setImagePreview(banner.image_url || banner.image);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({
                          id: banner.id,
                          is_active: !banner.is_active
                        })}
                        className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                          banner.is_active
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {banner.is_active ? '⏸ Deactivate' : '▶️ Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {editingBanner ? 'Edit Hero Banner' : 'Create New Hero Banner'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Banner Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={editingBanner?.title}
                      placeholder="e.g., Welcome to BidSoko"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      defaultValue={editingBanner?.subtitle}
                      placeholder="e.g., Your Ultimate Bidding Marketplace"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Image */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Banner Image {!editingBanner && '*'}
                    </label>
                    {imagePreview && (
                      <div className="mb-3">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      required={!editingBanner}
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 1200x500px (Max 5MB)
                    </p>
                  </div>

                  {/* CTA Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Button Text *
                    </label>
                    <input
                      type="text"
                      name="cta_text"
                      required
                      defaultValue={editingBanner?.cta_text || 'Shop Now'}
                      placeholder="e.g., Shop Now"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* CTA Link */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Button Link *
                    </label>
                    <input
                      type="text"
                      name="cta_link"
                      required
                      defaultValue={editingBanner?.cta_link || '/browse'}
                      placeholder="e.g., /browse or /category/electronics"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Order */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      min="0"
                      defaultValue={editingBanner?.order || 0}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first (0 = first)
                    </p>
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      defaultChecked={editingBanner?.is_active !== false}
                      className="w-5 h-5 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
                      Active (Show in carousel)
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={createMutation.isLoading || updateMutation.isLoading}
                      className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50"
                    >
                      {createMutation.isLoading || updateMutation.isLoading
                        ? 'Saving...'
                        : editingBanner
                        ? 'Update Banner'
                        : 'Create Banner'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingBanner(null);
                        setImagePreview(null);
                      }}
                      className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
