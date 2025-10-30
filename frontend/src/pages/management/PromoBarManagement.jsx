import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import ManagementLayout from '../../components/layout/ManagementLayout';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function PromoBarManagement() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // Fetch promo bar settings
  const { data: promoBar, isLoading } = useQuery({
    queryKey: ['promobar-settings'],
    queryFn: () => axios.get('/api/settings/promobar/').then(res => res.data),
  });

  // Update promo bar mutation
  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/settings/promobar/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['promobar-settings']);
      toast.success('✅ Promo bar updated successfully!');
      setShowCreateModal(false);
      setEditingPromo(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update promo bar');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const data = {
      brand_text: formData.get('brand_text'),
      brand_text_mobile: formData.get('brand_text_mobile'),
      brand_emoji: formData.get('brand_emoji'),
      phone_number: formData.get('phone_number'),
      phone_emoji: formData.get('phone_emoji'),
      announcement_text: formData.get('announcement_text'),
      cta_text: formData.get('cta_text'),
      cta_link: formData.get('cta_link'),
      background_color: formData.get('background_color'),
      text_color: formData.get('text_color'),
      accent_color: formData.get('accent_color'),
      is_active: true,
    };

    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading promo bar settings...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Promo Bar Management</h1>
            <p className="text-gray-600">Customize the promotional banner displayed across your site</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center gap-2"
          >
            <span className="text-xl">✏️</span>
            Edit Promo Bar
          </button>
        </div>

        {/* Live Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">👁️</span>
            Live Preview
          </h2>
          <div className="border-4 border-green-500 rounded-lg overflow-hidden">
            <div
              className="p-4"
              style={{
                backgroundColor: promoBar?.background_color || '#f9e5c9',
                color: promoBar?.text_color || '#1f2937'
              }}
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-4">
                  {/* Left */}
                  <div className="flex items-center">
                    <span
                      className="text-xl font-bold"
                      style={{ color: promoBar?.accent_color || '#ea580c' }}
                    >
                      {promoBar?.brand_emoji || '🎯'} {promoBar?.brand_text || 'BIDSOKO LUXE'}
                    </span>
                  </div>

                  {/* Center */}
                  <div className="flex-1 text-center hidden md:block">
                    <p className="text-sm font-semibold">
                      {promoBar?.phone_emoji || '📞'}{' '}
                      <span style={{ color: promoBar?.accent_color || '#ea580c' }} className="font-bold">
                        {promoBar?.phone_number || '0711 011 011'}
                      </span>{' '}
                      | {promoBar?.announcement_text || '🚚 Free Delivery on Orders Over KES 5,000'}
                    </p>
                  </div>

                  {/* Right */}
                  <div>
                    <span
                      className="px-6 py-2 rounded-full font-bold text-sm text-white"
                      style={{ backgroundColor: promoBar?.accent_color || '#ea580c' }}
                    >
                      {promoBar?.cta_text || 'SHOP NOW'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">This is how the promo bar will appear on your website</p>
        </div>

        {/* Current Settings */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Current Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Brand Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Brand Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand Text:</span>
                  <span className="font-medium">{promoBar?.brand_text}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mobile Text:</span>
                  <span className="font-medium">{promoBar?.brand_text_mobile}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand Emoji:</span>
                  <span className="font-medium text-xl">{promoBar?.brand_emoji}</span>
                </div>
              </div>
            </div>

            {/* Contact Settings */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Number:</span>
                  <span className="font-medium">{promoBar?.phone_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Emoji:</span>
                  <span className="font-medium text-xl">{promoBar?.phone_emoji}</span>
                </div>
              </div>
            </div>

            {/* Announcement */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Announcement</h3>
              <p className="text-sm text-gray-700">{promoBar?.announcement_text}</p>
            </div>

            {/* CTA Button */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Call-to-Action</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Button Text:</span>
                  <span className="font-medium">{promoBar?.cta_text}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Button Link:</span>
                  <span className="font-medium text-orange-600">{promoBar?.cta_link}</span>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="border rounded-lg p-4 md:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-3">Color Scheme</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: promoBar?.background_color }}
                  ></div>
                  <div>
                    <p className="text-xs text-gray-600">Background</p>
                    <p className="text-sm font-medium">{promoBar?.background_color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: promoBar?.text_color }}
                  ></div>
                  <div>
                    <p className="text-xs text-gray-600">Text</p>
                    <p className="text-sm font-medium">{promoBar?.text_color}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-12 h-12 rounded border-2 border-gray-300"
                    style={{ backgroundColor: promoBar?.accent_color }}
                  ></div>
                  <div>
                    <p className="text-xs text-gray-600">Accent</p>
                    <p className="text-sm font-medium">{promoBar?.accent_color}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Edit Promo Bar Settings</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Text (Desktop)
                  </label>
                  <input
                    type="text"
                    name="brand_text"
                    defaultValue={promoBar?.brand_text}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Brand Text Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Text (Mobile)
                  </label>
                  <input
                    type="text"
                    name="brand_text_mobile"
                    defaultValue={promoBar?.brand_text_mobile}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Brand Emoji */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Emoji
                  </label>
                  <input
                    type="text"
                    name="brand_emoji"
                    defaultValue={promoBar?.brand_emoji}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-2xl"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone_number"
                    defaultValue={promoBar?.phone_number}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Phone Emoji */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Emoji
                  </label>
                  <input
                    type="text"
                    name="phone_emoji"
                    defaultValue={promoBar?.phone_emoji}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-2xl"
                  />
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    name="cta_text"
                    defaultValue={promoBar?.cta_text}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Announcement Text */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Announcement Text
                  </label>
                  <input
                    type="text"
                    name="announcement_text"
                    defaultValue={promoBar?.announcement_text}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* CTA Link */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    name="cta_link"
                    defaultValue={promoBar?.cta_link}
                    placeholder="/browse"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="background_color"
                      defaultValue={promoBar?.background_color}
                      className="h-12 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      defaultValue={promoBar?.background_color}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      readOnly
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="text_color"
                      defaultValue={promoBar?.text_color}
                      className="h-12 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      defaultValue={promoBar?.text_color}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      readOnly
                    />
                  </div>
                </div>

                {/* Accent Color */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color (Highlights & CTA Button)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="accent_color"
                      defaultValue={promoBar?.accent_color}
                      className="h-12 w-20 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      defaultValue={promoBar?.accent_color}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ManagementLayout>
  );
}
