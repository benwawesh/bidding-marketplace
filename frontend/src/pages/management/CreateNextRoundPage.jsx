import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../api/axios";

export default function CreateNextRoundPage() {
  const { id } = useParams(); // current product/auction id
  const navigate = useNavigate();
  const [form, setForm] = useState({
    base_price: "",
    participation_fee: "", // Entry Fee
    min_pledge: "",
    max_pledge: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!form.base_price || isNaN(form.base_price)) {
      alert("Please enter a valid Base Price");
      return;
    }
    if (!form.participation_fee || isNaN(form.participation_fee)) {
      alert("Please enter a valid Entry Fee");
      return;
    }
    if (!form.min_pledge || isNaN(form.min_pledge)) {
      alert("Please enter a valid Min Pledge");
      return;
    }
    if (form.max_pledge && isNaN(form.max_pledge)) {
      alert("Please enter a valid Max Pledge or leave blank for Unlimited");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        base_price: parseFloat(form.base_price),
        participation_fee: parseFloat(form.participation_fee), // Entry Fee
        min_pledge: parseFloat(form.min_pledge),
        max_pledge: form.max_pledge ? parseFloat(form.max_pledge) : null,
      };

      const response = await axios.post(
        `/api/auctions/${id}/create_next_round/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("bidmarket_access_token")}`,
          },
        }
      );

      alert(`✅ Next round created successfully!\nRound ID: ${response.data.round_id}`);
      navigate(`/management/products/${id}`);
    } catch (error) {
      console.error(error);
      alert("❌ Failed to create next round: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Create Next Round</h1>

      <form className="bg-white p-6 rounded-lg shadow-lg space-y-4" onSubmit={handleSubmit}>
        {/* Base Price */}
        <div>
          <label className="block text-gray-700 mb-1 font-semibold">Base Price (KES)</label>
          <input
            type="number"
            name="base_price"
            value={form.base_price}
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
            value={form.participation_fee}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Min Pledge */}
        <div>
          <label className="block text-gray-700 mb-1 font-semibold">Min Pledge (KES)</label>
          <input
            type="number"
            name="min_pledge"
            value={form.min_pledge}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Max Pledge */}
        <div>
          <label className="block text-gray-700 mb-1 font-semibold">
            Max Pledge (KES) <span className="text-gray-400">(Leave blank for Unlimited)</span>
          </label>
          <input
            type="number"
            name="max_pledge"
            value={form.max_pledge}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            min="0"
            step="0.01"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "⏳ Creating..." : "Create Round"}
          </button>
        </div>
      </form>
    </div>
  );
}
