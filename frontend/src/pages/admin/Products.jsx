import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, X, LogOut } from 'lucide-react';
import { useStore } from '../../store';
import api from '../../api';
import './Products.css';

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    stock: '',
    available_sizes: ['S', 'M', 'L'],
    is_featured: false,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { logout } = useStore();
  const navigate = useNavigate();

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products/');
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSizeToggle = (size) => {
    const sizes = formData.available_sizes;
    if (sizes.includes(size)) {
      setFormData({
        ...formData,
        available_sizes: sizes.filter(s => s !== size),
      });
    } else {
      setFormData({
        ...formData,
        available_sizes: [...sizes, size],
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      submitData.append('name', formData.name);
      submitData.append('slug', formData.slug);
      submitData.append('description', formData.description);
      submitData.append('price', parseFloat(formData.price));
      submitData.append('stock', parseInt(formData.stock));
      submitData.append('category', parseInt(formData.category));
      submitData.append('is_featured', formData.is_featured);
      submitData.append('is_active', formData.is_active);
      submitData.append('available_sizes', JSON.stringify(formData.available_sizes));
      
      // Add image file if selected, otherwise use URL
      if (imageFile) {
        submitData.append('image', imageFile);
      } else if (formData.image_url) {
        submitData.append('image_url', formData.image_url);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}/`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        await api.post('/products/', submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      fetchProducts();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      image_url: product.image_url || '',
      stock: product.stock,
      available_sizes: product.available_sizes || [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.delete(`/products/${productId}/`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      category: '',
      image_url: '',
      stock: '',
      available_sizes: ['S', 'M', 'L'],
      is_featured: false,
      is_active: true,
    });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="admin-dashboard container fade-in">
      <div className="admin-header">
        <div>
          <h1>Manage Products</h1>
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
            <Link to="/admin/products" className="admin-nav-link active">Products</Link>
            <Link to="/admin/orders" className="admin-nav-link">Orders</Link>
            <Link to="/admin/categories" className="admin-nav-link">Categories</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="products-admin-content">
        <div className="products-header">
          <h2>All Products ({products.length})</h2>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={20} /> Add New Product
            </button>
          )}
        </div>

        {showForm && (
          <div className="product-form-container">
            <div className="form-header">
              <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-form-btn" onClick={handleCancel}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="input-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Floral Summer Dress"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Slug (auto-generated) *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="e.g., floral-summer-dress"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed product description..."
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Price (₵) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="89.99"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="25"
                    min="0"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Product Image</label>
                <div className="image-upload-section">
                  <div className="upload-options">
                    <div className="upload-option">
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="file-input"
                        />
                        <span className="upload-btn">
                          📷 Choose Image File
                        </span>
                      </label>
                      <small>Upload from computer (JPG, PNG, WebP)</small>
                    </div>
                    
                    <div className="upload-divider">
                      <span>OR</span>
                    </div>
                    
                    <div className="upload-option">
                      <input
                        type="url"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://images.unsplash.com/photo-xxxxx"
                        disabled={!!imageFile}
                      />
                      <small>
                        Use image URL from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>
                      </small>
                    </div>
                  </div>
                  
                  {(imagePreview || formData.image_url) && (
                    <div className="image-preview">
                      <img 
                        src={imagePreview || formData.image_url} 
                        alt="Preview" 
                      />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={clearImage}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="input-group">
                <label>Available Sizes</label>
                <div className="size-selector-admin">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`size-option ${formData.available_sizes.includes(size) ? 'active' : ''}`}
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleInputChange}
                  />
                  <span>Featured Product (show on homepage)</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Active (visible to customers)</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <div className="products-grid-admin">
            {products.map(product => (
              <div key={product.id} className="product-card-admin">
                <div className="product-image-admin">
                  <img 
                    src={product.image_display || product.image_url || 'https://via.placeholder.com/300x400?text=No+Image'} 
                    alt={product.name}
                  />
                  {product.is_featured && (
                    <span className="badge-featured">Featured</span>
                  )}
                  {!product.is_active && (
                    <span className="badge-inactive">Inactive</span>
                  )}
                </div>
                
                <div className="product-info-admin">
                  <h3>{product.name}</h3>
                  <p className="product-category-admin">{product.category_name}</p>
                  <p className="product-price-admin">₵{product.price}</p>
                  <p className="product-stock-admin">
                    Stock: <strong>{product.stock}</strong>
                  </p>
                  {product.available_sizes && product.available_sizes.length > 0 && (
                    <p className="product-sizes-admin">
                      Sizes: {product.available_sizes.join(', ')}
                    </p>
                  )}
                </div>

                <div className="product-actions-admin">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(product)}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(product.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && products.length === 0 && (
          <div className="empty-state">
            <p>No products yet. Click "Add New Product" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProducts;
