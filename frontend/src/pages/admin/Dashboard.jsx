import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, DollarSign, TrendingUp, LogOut } from 'lucide-react';
import { useStore } from '../../store';
import api from '../../api';
import './Dashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    total_revenue: 0,
  });
  const { logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/orders/stats/');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="admin-dashboard container fade-in">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-link active">Dashboard</Link>
            <Link to="/admin/products" className="admin-nav-link">Products</Link>
            <Link to="/admin/orders" className="admin-nav-link">Orders</Link>
            <Link to="/admin/categories" className="admin-nav-link">Categories</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="stats-grid grid grid-4">
        <div className="stat-card">
          <div className="stat-icon">
            <ShoppingCart size={32} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{stats.total_orders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <Package size={32} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Pending Orders</p>
            <p className="stat-value">{stats.pending_orders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon processing">
            <TrendingUp size={32} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Processing</p>
            <p className="stat-value">{stats.processing_orders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">
            <DollarSign size={32} />
          </div>
          <div className="stat-details">
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">₵{stats.total_revenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/admin/products" className="btn btn-primary">Manage Products</Link>
          <Link to="/admin/orders" className="btn btn-secondary">View Orders</Link>
          <Link to="/admin/categories" className="btn btn-outline">Manage Categories</Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
