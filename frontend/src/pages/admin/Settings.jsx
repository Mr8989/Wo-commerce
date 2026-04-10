import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useStore } from '../../store';
import '../admin/Dashboard.css';
import './Settings.css';

function AdminSettings() {
  const { logout } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setMessage({ type: '', text: '' });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ type: '', text: '' });

  // Validation
  if (formData.newPassword !== formData.confirmPassword) {
    setMessage({ type: 'error', text: '❌ New passwords do not match' });
    setLoading(false);
    return;
  }

  const passwordError = validatePassword(formData.newPassword);
  if (passwordError) {
    setMessage({ type: 'error', text: `❌ ${passwordError}` });
    setLoading(false);
    return;
  }

  if (formData.newPassword === formData.currentPassword) {
    setMessage({ type: 'error', text: '❌ New password must be different from current password' });
    setLoading(false);
    return;
  }

  // Call API to change password
  const result = await changePassword(formData.currentPassword, formData.newPassword);
  
  if (result.success) {
    setMessage({ 
      type: 'success', 
      text: '✅ Password changed successfully! Your new password is now active.' 
    });
    
    // Clear form after success
    setTimeout(() => {
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: '', text: '' });
    }, 3000);
  } else {
    setMessage({ 
      type: 'error', 
      text: `❌ ${result.error}` 
    });
  }
  
  setLoading(false);
};

  return (
    <div className="admin-dashboard container fade-in">
      <div className="admin-header">
        <div>
          <h1>Admin Settings</h1>
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
            <Link to="/admin/products" className="admin-nav-link">Products</Link>
            <Link to="/admin/orders" className="admin-nav-link">Orders</Link>
            <Link to="/admin/categories" className="admin-nav-link">Categories</Link>
            <Link to="/admin/settings" className="admin-nav-link active">Settings</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="settings-header">
            <Lock size={32} />
            <div>
              <h2>Change Password</h2>
              <p>Update your admin password to keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="password-form">
            {message.text && (
              <div className={`message-box ${message.type}`}>
                {message.text}
              </div>
            )}

            {/* Current Password */}
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul>
                  <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                    <CheckCircle size={16} /> At least 8 characters
                  </li>
                  <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                    <CheckCircle size={16} /> One uppercase letter
                  </li>
                  <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                    <CheckCircle size={16} /> One lowercase letter
                  </li>
                  <li className={/[0-9]/.test(formData.newPassword) ? 'valid' : ''}>
                    <CheckCircle size={16} /> One number
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && (
                <p className={`password-match ${formData.newPassword === formData.confirmPassword ? 'valid' : 'invalid'}`}>
                  {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={loading}
              >
                <Lock size={20} />
                {loading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>

          <div className="security-notice">
            <h3>Security Tips</h3>
            <ul>
              <li>Use a strong, unique password</li>
              <li>Don't share your password with anyone</li>
              <li>Change your password regularly</li>
              <li>After changing password, update your .env file</li>
            </ul>
          </div>
        </div>

        {/* Account Information */}
        <div className="settings-card">
          <div className="settings-header">
            <div>
              <h2>Account Information</h2>
              <p>Your admin account details</p>
            </div>
          </div>

          <div className="account-info">
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{import.meta.env.VITE_ADMIN_USERNAME}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">Administrator</span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="status-badge active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;