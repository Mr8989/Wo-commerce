import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Eye, Trash2, X } from 'lucide-react';
import { useStore } from '../../store';
import api from '../../api';
import '../admin/Dashboard.css';
import '../admin/Order.css';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { logout } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/');
        setOrders(response.data.results || response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    };

    fetchOrders();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'var(--color-secondary)',
      processing: 'var(--color-accent)',
      shipped: 'var(--color-success)',
      delivered: 'var(--color-success)',
      cancelled: 'var(--color-error)',
    };
    return colors[status] || 'var(--color-text)';
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
      console.log('Deleting order', orderId)

      const response = await api.delete(`/orders/${orderId}/`);

      console.log('Delete response:', response);


      
      // Remove from local state
      setOrders(orders.filter(order => order.id !== orderId));
      
      // Close modal if it's open
      if (showModal && selectedOrder?.id === orderId) {
        handleCloseModal();
      }
      
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    }
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
          </nav>
        </div>
        <button onClick={handleLogout} className="btn btn-outline logout-btn-admin">
          <LogOut size={20} /> Logout
        </button>
      </div>

      <div style={{ backgroundColor: 'white', padding: 'var(--spacing-xl)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-primary)' }}>All Orders ({orders.length})</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Order #</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: 'var(--spacing-md)', textAlign: 'left' }}>Email</th>
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
                  <td style={{ padding: 'var(--spacing-md)', fontWeight: '600' }}>{order.order_number}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>{order.first_name} {order.last_name}</td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <a href={`tel:${order.phone}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                      {order.phone}
                    </a>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <a href={`mailto:${order.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
                      {order.email}
                    </a>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', fontWeight: '700', color: 'var(--color-accent)' }}>
                    ₵{order.total_amount}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
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
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: getStatusColor(order.status), 
                      color: 'white', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.85rem',
                      textTransform: 'uppercase'
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-light)' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
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
            <p>No orders yet</p>
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
                <p><strong>Status:</strong> <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  backgroundColor: getStatusColor(selectedOrder.status), 
                  color: 'white', 
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem'
                }}>{selectedOrder.status}</span></p>
                <p><strong>Payment Method:</strong> {selectedOrder.payment_method ? selectedOrder.payment_method.replace(/_/g, ' ') : 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(selectedOrder.created_at).toLocaleString()}</p>
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
                      <span style={{ fontWeight: '700' }}>${item.total_price}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-detail-section">
                <h3>Total Amount</h3>
                <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                  ₵{selectedOrder.total_amount}
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