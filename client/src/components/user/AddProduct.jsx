import { useState } from 'react';
import axios from 'axios';

const AddProduct = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      await delay(1000);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/allegro/search`, {
        params: { phrase: searchQuery }
      });
      // Set searchResults to the products array from the response
      setSearchResults(response.data.products || []);
      console.log(response.data.products);
    } catch (err) {
      setError('Failed to fetch products. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    console.log('Adding product:', selectedProduct);
    alert(`Product "${selectedProduct.name}" added successfully!`);
    setSelectedProduct(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products..."
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              &times; {/* Clear button */}
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!searchQuery || isLoading}
          className={`mt-3 w-full py-2 px-4 rounded-lg font-medium ${
            !searchQuery || isLoading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } transition`}
        >
          {isLoading ? 'Searching...' : 'Search Products'}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <h3 className="bg-gray-100 px-4 py-2 font-medium text-gray-700">Znalezione Produkty</h3>
          <ul className="divide-y divide-gray-200">
            {searchResults.map((product) => (
              <li key={product.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div 
                  className="flex items-center justify-between"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={product.images[0]?.url || 'https://via.placeholder.com/50'} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-medium text-gray-800">{product.name}</h4>
                      <p className="text-sm text-gray-500">{product.category?.path.join(' > ')}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-blue-600">
                    ${product.price}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {/* Selected Product */}
      {selectedProduct && (
        <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-800 mb-3">Produkt Wybrany</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={selectedProduct.images[0]?.url || 'https://via.placeholder.com/50'} 
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h4 className="font-medium text-gray-800">{selectedProduct.name}</h4>
                <p className="text-sm text-gray-500">{selectedProduct.category?.path.join(' > ')}</p>
              </div>
            </div>
            <span className="font-semibold text-green-600">
              ${selectedProduct.price}
            </span>
          </div>
          <button
            onClick={handleAddProduct}
            className="mt-4 w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            Add Product
          </button>
        </div>
      )}
    </div>
  );
};

export default AddProduct;