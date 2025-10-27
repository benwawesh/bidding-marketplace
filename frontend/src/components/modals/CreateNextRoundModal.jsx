import { useState } from "react";

export default function CreateNextRoundModal({ isOpen, onClose, onSubmit, defaultValues }) {
  const [formData, setFormData] = useState({
    base_price: defaultValues?.base_price || "",
    participation_fee: defaultValues?.participation_fee || "",
    min_pledge: defaultValues?.min_pledge || "",
    max_pledge: defaultValues?.max_pledge || "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { base_price, participation_fee, min_pledge, max_pledge } = formData;

    if (!base_price || !participation_fee || !min_pledge || !max_pledge) {
      alert("Please fill in all fields.");
      return;
    }

    onSubmit({
      base_price: parseFloat(base_price),
      participation_fee: parseFloat(participation_fee), // entry fee
      min_pledge: parseFloat(min_pledge),
      max_pledge: parseFloat(max_pledge),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Create Next Round</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base Price */}
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Base Price (KES)</label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Entry Fee */}
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Entry Fee (KES)</label>
            <input
              type="number"
              name="participation_fee"
              value={formData.participation_fee}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="0"
              step="0.01"
              placeholder="e.g., 50"
            />
          </div>

          {/* Min Pledge */}
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Min Pledge (KES)</label>
            <input
              type="number"
              name="min_pledge"
              value={formData.min_pledge}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Max Pledge */}
          <div>
            <label className="block text-gray-700 mb-1 font-semibold">Max Pledge (KES)</label>
            <input
              type="number"
              name="max_pledge"
              value={formData.max_pledge}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Create Round
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
