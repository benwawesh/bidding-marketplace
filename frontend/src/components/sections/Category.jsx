// src/components/sections/Category.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Category({ onSelectCategory }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get('/api/categories/');
        setCategories(res.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {categories.map((category) => (
        <div
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className="border rounded-xl p-4 cursor-pointer text-center hover:bg-gray-100 transition"
        >
          <h3 className="font-semibold">{category.name}</h3>
        </div>
      ))}
    </div>
  );
}

export default Category;
