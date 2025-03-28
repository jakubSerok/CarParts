import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

const AddProduct = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { register, handleSubmit } = useForm();

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/allegro/products/search?q=${searchTerm}`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/allegro/products/offers`, {
        ...data,
        productId: selectedProduct.id
      });
      alert('Offer created successfully!');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  return (
    <div className="add-product-container">
      <h2>Add Product</h2>
      <div className="search-section">
        <input
          type="text"
          placeholder="Enter GTIN (EAN) or product name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {products.length > 0 && (
        <div className="product-list">
          {products.map(product => (
            <div key={product.id} onClick={() => setSelectedProduct(product)}>
              {product.name}
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <h3>Create Offer for {selectedProduct.name}</h3>
          <input {...register('price')} placeholder="Price" />
          <input {...register('quantity')} placeholder="Quantity" />
          <textarea {...register('description')} placeholder="Description" />
          <button type="submit">Create Offer</button>
        </form>
      )}
    </div>
  );
};

export default AddProduct;
