import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import api from '../api';
import './Shop.css';

function Shop() {
  const { products, setProducts, categories, setCategories, selectedCategory, setSelectedCategory } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products/'),
          api.get('/categories/')
        ]);
        setProducts(productsRes.data.results || productsRes.data);
        setCategories(categoriesRes.data.results || categoriesRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setProducts, setCategories]);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_name === selectedCategory)
    : products;

  return (
    <div className="shop container fade-in">
      <div className="shop-header">
        <h1>Our Collection</h1>
        <p>Discover pieces that define your style</p>
      </div>

      <div className="shop-filters">
        <button 
          className={`filter-btn ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(cat => (
          <button 
            key={cat.id}
            className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading products...</div>
      ) : (
        <div className="products-grid grid grid-4">
          {filteredProducts.map(product => (
            <Link to={`/product/${product.slug}`} key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image_display || product.image_url || 'https://via.placeholder.com/400x500'} alt={product.name} />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category_name}</p>
                <p className="product-price">₵{product.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Shop;
