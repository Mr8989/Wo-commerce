import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { useStore } from '../store';
import api from '../api';
import './ProductDetail.css';

function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${slug}/`);
        setProduct(response.data);
        if (response.data.available_sizes?.length > 0) {
          setSelectedSize(response.data.available_sizes[0]);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, selectedSize, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  if (!product) return <div className="loading">Loading...</div>;

  return (
    <div className="product-detail container fade-in">
      <div className="product-detail-grid">
        <div className="product-detail-image">
          <img
            src={product.image_display || product.image_url || 'https://via.placeholder.com/600x800'}
            alt={product.name}
            fetchpriority="high"
            decoding="async"
          />
        </div>
        
        <div className="product-detail-info">
          <p className="product-detail-category">{product.category_name}</p>
          <h1 className="product-detail-name">{product.name}</h1>
          <p className="product-detail-price">₵{product.price}</p>
          
          <div className="product-detail-description">
            <p>{product.description}</p>
          </div>

          {product.available_sizes && product.available_sizes.length > 0 && (
            <div className="size-selector">
              <label>Size</label>
              <div className="size-options">
                {product.available_sizes.map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="quantity-selector">
            <label>Quantity</label>
            <div className="quantity-controls">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <button className="btn btn-primary add-to-cart-btn" onClick={handleAddToCart}>
            {added ? <><Check size={20} /> Added to Cart</> : <><ShoppingBag size={20} /> Add to Cart</>}
          </button>

          {product.stock < 10 && product.stock > 0 && (
            <p className="stock-warning">Only {product.stock} items left in stock!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
