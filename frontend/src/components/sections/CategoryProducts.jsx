// src/components/sections/CategoryProducts.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CategoryProducts({ categoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) return;
    async function fetchProducts() {
      try {
        const res = await axios.get(`http://localhost:8000/api/categories/${categoryId}/products/`);
        setProducts(res.data);
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [categoryId]);

  if (!categoryId) return <p>Select a category to view products.</p>;
  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
      {products.length === 0 && <p>No products found in this category.</p>}
      {products.map((product) => (
        <div key={product.id} className="border p-4 rounded-xl hover:shadow-md transition">
          <h3 className="font-semibold">{product.title}</h3>
          <p>Price: KES {product.base_price}</p>
          {product.main_image && (
            <img src={product.main_image} alt={product.title} className="w-full rounded-md mt-2" />
          )}
        </div>
      ))}
    </div>
  );
}

export default CategoryProducts;
