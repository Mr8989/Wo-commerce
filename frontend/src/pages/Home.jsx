import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, Shield, Heart } from 'lucide-react';
import { useStore } from '../store';
import api from '../api';
import './Home.css';

// Background slideshow images. Module scope so the array identity is stable
// across renders and the effects below don't re-run on every paint.
const slideshowImages = [
  '/slide1.jpg',
  '/slide2.jpg',
  '/slide3.jpg',
  '/slide4.jpg',
  '/slide5.jpg',
  '/slide6.jpg',
  '/slide7.jpeg',
];

// Fetch the upcoming photo once the browser is idle, so it never competes
// with the first slide or the product grid for bandwidth.
const whenIdle = (fn) =>
  typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback(fn, { timeout: 2000 })
    : setTimeout(fn, 1200);

const cancelIdle = (handle) =>
  typeof window.cancelIdleCallback === 'function'
    ? window.cancelIdleCallback(handle)
    : clearTimeout(handle);

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  // Only slides that have been reached carry a background-image, so the
  // browser downloads one photo for the first paint instead of all seven.
  const [loadedSlides, setLoadedSlides] = useState(() => new Set([0]));

  // Fetch featured products
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products/featured/');
        setFeaturedProducts(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Pull in the next photo ahead of the crossfade to it
  useEffect(() => {
    const next = (currentSlide + 1) % slideshowImages.length;
    const handle = whenIdle(() => {
      setLoadedSlides((prev) => (prev.has(next) ? prev : new Set(prev).add(next)));
    });
    return () => cancelIdle(handle);
  }, [currentSlide]);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideshowImages.length]);

  return (
    <div className="home">
      {/* Hero Section with Background Slideshow */}
      <section className="hero">
        {/* Background Slideshow */}
        <div className="slideshow-container">
          {slideshowImages.map((image, index) => (
            <div
              key={index}
              className={`slide ${index === currentSlide ? 'active' : ''}`}
              style={loadedSlides.has(index) ? { backgroundImage: `url(${image})` } : undefined}
            />
          ))}
          <div className="slideshow-overlay" />
        </div>

        {/* Hero Content */}
        <div className="hero-content container">
          <h1 className="hero-title">Discover Your Style</h1>
          <p className="hero-subtitle">
            Elegant fashion for the modern woman. Explore our curated collection of premium pieces.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-primary">
              <ShoppingBag size={20} />
              Shop Now
            </Link>
            <Link to="/shop?featured=true" className="btn btn-outline">
              View Collection
            </Link>
          </div>
        </div>

        {/* Slideshow Indicators */}
        <div className="slideshow-indicators">
          {slideshowImages.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {/* <div className="feature-card">
              <div className="feature-icon">
                <Truck size={32} />
              </div>
              <h3>Free Delivery</h3>
              <p>On orders over GH₵1000</p>
            </div> */}
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={32} />
              </div>
              <h3>Secure Payment</h3>
              <p>100% secure transactions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Heart size={32} />
              </div>
              <h3>Quality Guarantee</h3>
              <p>Premium materials only</p>
            </div>
            {/* <div className="feature-card">
              <div className="feature-icon">
                <ShoppingBag size={32} />
              </div>
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div> */}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <p>Handpicked favorites from our latest collection</p>
          </div>
          <div className="products-grid">
            {featuredProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="product-card"
              >
                <div className="product-image">
                  <img
                    src={product.image_display || product.image_url || 'https://via.placeholder.com/400x500?text=No+Image'}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                  />
                  {product.is_featured && (
                    <span className="badge">Featured</span>
                  )}
                </div>
                <div className="product-info">
                  <p className="product-category">{product.category_name}</p>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
          {featuredProducts.length > 0 && (
            <div className="section-cta">
              <Link to="/shop" className="btn btn-outline">
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Subscribe to our newsletter for exclusive offers and style tips</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email"
                className="newsletter-input"
              />
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;