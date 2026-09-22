import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Eye, Trash2, X, CheckCircle, Clock, Package, Truck, MapPin } from 'lucide-react';
import { useStore } from '../../store';
import api from '../../api';
import '../admin/Dashboard.css';
import '../admin/order.css';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const { logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      let url = '/orders/';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const response = await api.get(url);
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9800',
      processing: '#2196F3',
      shipped: '#4CAF50',
      delivered: '#2E7D32',
      cancelled: '#F44336',
    };
    return colors[status] || '#666';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={18} />,
      processing: <Package size={18} />,
      shipped: <Truck size={18} />,
      delivered: <MapPin size={18} />,
      cancelled: <X size={18} />,
    };
    return icons[status] || <Clock size={18} />;
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!confirm(`Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/orders/${orderId}/`);
      setOrders(orders.filter(order => order.id !== orderId));
      
      if (showModal && selectedOrder?.id === orderId) {
        handleCloseModal();
      }
      
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const order = orders.find(o => o.id === orderId) || selectedOrder;
    
    if (!confirm(`Change order status to "${newStatus.toUpperCase()}"?\n\nCustomer will receive an SMS notification.`)) {
      return;
    }

    try {
      await api.patch(`/orders/${orderId}/`, { status: newStatus });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Update modal if open
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      alert(` Order status updated to "${newStatus.toUpperCase()}"\n\nCustomer will receive an SMS notification.`);
      
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'processing',
      'processing': 'shipped',
      'shipped': 'delivered',
      'delivered': null,
      'cancelled': null
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      'pending': 'Mark as Processing',
      'processing': 'Mark as Shipped',
      'shipped': 'Mark as Delivered',
      'delivered': 'Completed',
      'cancelled': 'Cancelled'
    };
    return labels[currentStatus];
  };

  return (
    <div className="admin-dashboard container fade-in">
      <div className="admin-header">
        <div>
          <h1>Manage Orders</h1>
          <nav className="admin-nav">
            <Link to="/admin" className="admin-nav-link">Dashboard</Link>
            <Link to="/admin/products" className="admin-nav-link">Products</Link>
            <Link to="/admin/orders" className="admin-nav-link active">Orders</Link>
            <Link to="/admin/categories" className="admin-nav-link">Categories</Link>
            <Link to="/admin/settings" className="admin-nav-link">Settings</Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      {/* Status Filter */}
      <div className="orders-filters">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <div className="status-filters">
            <button 
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Orders ({orders.length})
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <Clock size={16} /> Pending
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
              onClick={() => setStatusFilter('processing')}
            >
              <Package size={16} /> Processing
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('shipped')}
            >
              <Truck size={16} /> Shipped
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setStatusFilter('delivered')}
            >
              <MapPin size={16} /> Delivered
            </button>
            <button 
              className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              <X size={16} /> Cancelled
            </button>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary)' }}>
          {statusFilter === 'all' ? 'All Orders' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders`} ({orders.length})
        </h2>
        
        {/* Status Guide */}
        <div className="status-guide">
          <div className="guide-item">
            <div className="guide-icon" style={{ backgroundColor: 'rgba(255, 152, 0, 0.1)', color: '#FF9800' }}>
              <Clock size={16} />
            </div>
            <div className="guide-text">
              <strong>Pending</strong>
              <span>Payment not verified</span>
            </div>
          </div>
          <div className="guide-arrow">→</div>
          <div className="guide-item">
            <div className="guide-icon" style={{ backgroundColor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3' }}>
              <Package size={16} />
            </div>
            <div className="guide-text">
              <strong>Processing</strong>
              <span>Payment verified, preparing</span>
            </div>
          </div>
          <div className="guide-arrow">→</div>
          <div className="guide-item">
            <div className="guide-icon" style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50' }}>
              <Truck size={16} />
            </div>
            <div className="guide-text">
              <strong>Shipped</strong>
              <span>Out for delivery</span>
            </div>
          </div>
          <div className="guide-arrow">→</div>
          <div className="guide-item">
            <div className="guide-icon" style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#2E7D32' }}>
              <MapPin size={16} />
            </div>
            <div className="guide-text">
              <strong>Delivered</strong>
              <span>Customer received</span>
            </div>
          </div>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Order #</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Total</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Payment</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Status</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Date</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td data-label="Order #" style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>{order.order_number}</td>
                  <td data-label="Customer" style={{ padding: 'var(--spacing-md)' }}>{order.first_name} {order.last_name}</td>
                  <td data-label="Phone" style={{ padding: 'var(--spacing-md)' }}>
                    <a href={`tel:${order.phone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                      {order.phone}
                    </a>
                  </td>
                  <td data-label="Total" style={{ padding: 'var(--spacing-md)', fontWeight: '700', color: 'var(--color-accent)' }}>
                    GH₵{order.total_amount}
                  </td>
                  <td data-label="Payment" style={{ padding: 'var(--spacing-md)' }}>
                    <span style={{
                      fontSize: '0.85rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--color-bg)',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'capitalize'
                    }}>
                      {order.payment_method ? order.payment_method.replace(/_/g, ' ') : 'N/A'}
                    </span>
                  </td>
                  <td data-label="Status" style={{ padding: 'var(--spacing-md)' }}>
                    <div className="status-cell">
                      <div 
                        className="status-badge-with-icon" 
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {getStatusIcon(order.status)}
                        <span>{order.status}</span>
                      </div>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                          className="quick-status-btn"
                          title={getNextStatusLabel(order.status)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td data-label="Date" style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-light)' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td data-label="Actions" style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleViewOrder(order)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id, order.order_number)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-error)',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          borderRadius: 'var(--radius-sm)',
                          transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(200, 70, 48, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Delete Order"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xxl)', color: 'var(--color-text-light)' }}>
            <p>No {statusFilter !== 'all' ? statusFilter : ''} orders found</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal}></div>
          <div className="order-modal">
            <div className="modal-header">
              <h2>Order Details</h2>
              <button onClick={handleCloseModal} className="close-modal-btn">
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="order-detail-section">
                <h3>Order Information</h3>
                <p><strong>Order Number:</strong> {selectedOrder.order_number}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> {selectedOrder.payment_method ? selectedOrder.payment_method.replace(/_/g, ' ') : 'N/A'}</p>
                
                {/* Status Update Section */}
                <div className="status-update-section">
                  <label><strong>Update Status:</strong></label>
                  <div className="status-options">
                    {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedOrder.id, status)}
                        className={`status-option-btn ${selectedOrder.status === status ? 'active' : ''}`}
                        style={{
                          backgroundColor: selectedOrder.status === status ? getStatusColor(status) : 'transparent',
                          borderColor: getStatusColor(status),
                          color: selectedOrder.status === status ? 'white' : getStatusColor(status)
                        }}
                      >
                        {getStatusIcon(status)}
                        <span>{status}</span>
                      </button>
                    ))}
                  </div>
                  <p className="status-note">
                    ℹ️ Customer will receive an SMS notification when status changes.
                  </p>
                </div>
              </div>

              <div className="order-detail-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedOrder.first_name} {selectedOrder.last_name}</p>
                <p><strong>Phone:</strong> <a href={`tel:${selectedOrder.phone}`}>{selectedOrder.phone}</a></p>
                <p><strong>Email:</strong> <a href={`mailto:${selectedOrder.email}`}>{selectedOrder.email}</a></p>
              </div>

              <div className="order-detail-section">
                <h3>Delivery Address</h3>
                <p>{selectedOrder.delivery_address || selectedOrder.shipping_address}</p>
                <p>{selectedOrder.delivery_city || selectedOrder.shipping_city}, {selectedOrder.delivery_state || selectedOrder.shipping_state}</p>
                <p>{selectedOrder.delivery_postal_code || selectedOrder.shipping_postal_code}</p>
                <p>{selectedOrder.delivery_country || selectedOrder.shipping_country}</p>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="order-detail-section">
                  <h3>Order Items</h3>
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} style={{ 
                      padding: 'var(--spacing-sm)', 
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{item.product_name} (Size: {item.size}) × {item.quantity}</span>
                      <span style={{ fontWeight: '700' }}>GH₵{item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-detail-section">
                <h3>Total Amount</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                  GH₵{selectedOrder.total_amount}
                </p>
              </div>

              {selectedOrder.notes && (
                <div className="order-detail-section">
                  <h3>Notes</h3>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                className="btn btn-outline"
                style={{ 
                  color: 'var(--color-error)', 
                  borderColor: 'var(--color-error)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={18} /> Delete Order
              </button>
              <button onClick={handleCloseModal} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminOrders;