import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Save, X, LogOut } from 'lucide-react';
import { useStore } from '../../store';
import api from '../../api';
import '../admin/Products.css';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const { logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}/`, formData);
      } else {
        await api.post('/categories/', formData);
      }

      fetchCategories();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This will affect all products in this category!')) return;

    try {
      await api.delete(`/categories/${categoryId}/`);
      fetchCategories();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category. It may have products associated with it.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
    });
    setEditingCategory(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="admin-dashboard container fade-in">
      <div className="admin-header">
        <div>
          <h1>Manage Categories</h1>
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
            <Link to="/admin/products" className="admin-nav-link">Products</Link>
            <Link to="/admin/orders" className="admin-nav-link">Orders</Link>
            <Link to="/admin/categories" className="admin-nav-link active">Categories</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="products-admin-content">
        <div className="products-header">
          <h2>All Categories ({categories.length})</h2>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={20} /> Add New Category
            </button>
          )}
        </div>

        {showForm && (
          <div className="product-form-container">
            <div className="form-header">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              <button className="close-form-btn" onClick={handleCancel}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-row">
                <div className="input-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Dresses"
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
                    placeholder="e.g., dresses"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of this category..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={20} />
                  {loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
                </button>
                <button type="button" className="btn btn-outline" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showForm && (
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <h3>{category.name}</h3>
                  <span className="category-count">{category.product_count || 0} products</span>
                </div>
                <p className="category-description">
                  {category.description || 'No description'}
                </p>
                <div className="category-actions">
                  <button 
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(category)}
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    className="btn-icon btn-delete"
                    onClick={() => handleDelete(category.id)}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showForm && categories.length === 0 && (
          <div className="empty-state">
            <p>No categories yet. Click "Add New Category" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminCategories;
