import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, MapPin, Clock } from 'lucide-react';
import api from '../api';
import './TrackOrder.css';

function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const response = await api.get(`/orders/?search=${orderNumber}`);
      const orders = response.data.results || response.data;
      
      if (orders.length > 0) {
        setOrder(orders[0]);
      } else {
        setError('Order not found. Please check your order number and try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = {
      'pending': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': 0
    };
    return steps[status] || 1;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FF9800',
      'processing': '#2196F3',
      'shipped': '#4CAF50',
      'delivered': '#2E7D32',
      'cancelled': '#F44336'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="track-order container fade-in">
      <div className="track-header">
        <h1>Track Your Order</h1>
        <p>Enter your order number to track your delivery</p>
      </div>

      <form onSubmit={handleSearch} className="track-search">
        <div className="search-input-group">
          <Search size={20} />
          <input
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter order number (e.g., WW20260401-ABCD)"
            required
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {order && (
        <div className="track-result">
          <div className="order-info-card">
            <h2>Order #{order.order_number}</h2>
            <p className="order-date">
              <Clock size={16} />
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>

          {order.status !== 'cancelled' && (
            <div className="tracking-progress">
              <div className="progress-steps">
                <div className={`step ${getStatusStep(order.status) >= 1 ? 'completed' : ''} ${getStatusStep(order.status) === 1 ? 'active' : ''}`}>
                  <div className="step-icon">
                    <Package size={24} />
                  </div>
                  <div className="step-info">
                    <div className="step-label">Order Placed</div>
                    <div className="step-sublabel">We've received your order</div>
                  </div>
                </div>

                <div className={`step ${getStatusStep(order.status) >= 2 ? 'completed' : ''} ${getStatusStep(order.status) === 2 ? 'active' : ''}`}>
                  <div className="step-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="step-info">
                    <div className="step-label">Processing</div>
                    <div className="step-sublabel">Preparing your order</div>
                  </div>
                </div>

                <div className={`step ${getStatusStep(order.status) >= 3 ? 'completed' : ''} ${getStatusStep(order.status) === 3 ? 'active' : ''}`}>
                  <div className="step-icon">
                    <Truck size={24} />
                  </div>
                  <div className="step-info">
                    <div className="step-label">Shipped</div>
                    <div className="step-sublabel">On the way to you</div>
                  </div>
                </div>

                <div className={`step ${getStatusStep(order.status) >= 4 ? 'completed' : ''} ${getStatusStep(order.status) === 4 ? 'active' : ''}`}>
                  <div className="step-icon">
                    <MapPin size={24} />
                  </div>
                  <div className="step-info">
                    <div className="step-label">Delivered</div>
                    <div className="step-sublabel">Package delivered</div>
                  </div>
                </div>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(getStatusStep(order.status) / 4) * 100}%`,
                    backgroundColor: getStatusColor(order.status)
                  }}
                />
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="cancelled-notice">
              <h3>Order Cancelled</h3>
              <p>This order has been cancelled. If you have any questions, please contact us.</p>
            </div>
          )}

          <div className="order-details-grid">
            <div className="detail-card">
              <h3>Customer Information</h3>
              <div className="detail-content">
                <p><strong>Name:</strong> {order.first_name} {order.last_name}</p>
                <p><strong>Email:</strong> {order.email}</p>
                <p><strong>Phone:</strong> {order.phone}</p>
              </div>
            </div>

            <div className="detail-card">
              <h3>Delivery Address</h3>
              <div className="detail-content">
                <p>{order.delivery_address}</p>
                <p>{order.delivery_city}, {order.delivery_state}</p>
                <p>{order.delivery_postal_code}</p>
                <p>{order.delivery_country}</p>
              </div>
            </div>

            <div className="detail-card">
              <h3>Order Summary</h3>
              <div className="detail-content">
                <p><strong>Total:</strong> GH₵{order.total_amount}</p>
                <p><strong>Payment:</strong> {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="order-items-card">
              <h3>Order Items</h3>
              <div className="items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.product_name}</span>
                      <span className="item-details">
                        Size: {item.size} | Quantity: {item.quantity}
                      </span>
                    </div>
                    <span className="item-price">GH₵{item.total_price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="help-section">
            <h3>Need Help?</h3>
            <p>If you have any questions about your order, please contact us:</p>
            <div className="contact-info">
              <p> Phone: +233 54 489 3583</p>
              <p>Email: odjerflorence610@gmail.com</p>
              <p> Location: UHAS Campus, Ho, Volta Region</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;