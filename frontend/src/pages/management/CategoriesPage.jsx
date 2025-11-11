import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '../../api/endpoints';
import ManagementLayout from '../../components/layout/ManagementLayout';
import { toast } from 'react-hot-toast';

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesAPI.getAll().then(res => res.data?.results || res.data || []),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (formData) => {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.image) {
        data.append('image', formData.image);
      }
      return categoriesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['categories']);
      toast.success('Category created successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.name?.[0] || 'Failed to create category');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.image) {
        data.append('image', formData.image);
      }
      return categoriesAPI.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['categories']);
      toast.success('Category updated successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.name?.[0] || 'Failed to update category');
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: (id) => categoriesAPI.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['categories']);
      toast.success('Category status updated!');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories']);
      queryClient.invalidateQueries(['categories']);
      toast.success('Category deleted successfully!');
    },
  });

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        image: null,
      });
      setImagePreview(category.image);
    } else {
      setEditingCategory(null);
      setFormData({ name: '', image: null });
      setImagePreview(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', image: null });
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDelete = (category) => {
    if (window.confirm(`Delete category "${category.name}"? This will deactivate it.`)) {
      deleteMutation.mutate(category.id);
    }
  };

  if (isLoading) {
    return (
      <ManagementLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </ManagementLayout>
    );
  }

  return (
    <ManagementLayout>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600">Manage product categories for your marketplace</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold transition"
          >
            ➕ Create Category
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Total Categories</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{categories.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {categories.filter(c => c.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-gray-600">
            <p className="text-sm text-gray-600 uppercase font-semibold">Inactive</p>
            <p className="text-3xl font-bold text-gray-600 mt-2">
              {categories.filter(c => !c.is_active).length}
            </p>
          </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Image</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Slug</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Products</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <p className="text-gray-500 mb-4 font-semibold">No categories yet</p>
                    <p className="text-gray-400 text-sm mb-6">Create your first category to organize products</p>
                    <button
                      onClick={() => openModal()}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                    >
                      Create First Category
                    </button>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-4 px-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            📦
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-gray-900">{category.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-500 font-mono">{category.slug}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {category.auction_count} {category.auction_count === 1 ? 'product' : 'products'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleActiveMutation.mutate(category.id)}
                        disabled={toggleActiveMutation.isPending}
                        className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                          category.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } disabled:opacity-50`}
                      >
                        {category.is_active ? '✓ Active' : '✗ Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openModal(category)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
                          className="text-red-600 hover:text-red-700 font-medium text-sm hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {editingCategory ? 'Update category details' : 'Add a new product category'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Electronics, Fashion, Home & Garden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Slug will be auto-generated from the name
                  </p>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category Image (optional for now)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: Square image (300x300px or larger)
                  </p>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 mb-3 font-semibold">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 transition"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 
                     editingCategory ? 'Update Category' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  );
}
