import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Mail, Phone } from 'lucide-react';
import api from '../api';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/track/${encodeURIComponent(orderNumber)}/`);
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrder();
    }
  }, [orderNumber]);

  const paymentMethod = location.state?.paymentMethod || order?.payment_method || 'bank_transfer';

  if (loading) {
    return (
      <div className="order-confirmation container fade-in">
        <div className="confirmation-loading">
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-confirmation container fade-in">
        <div className="confirmation-error">
          <h2>Order Not Found</h2>
          <p>We couldn't find your order. Please check your email for confirmation.</p>
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation container fade-in">
      <div className="confirmation-header">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>
        <h1>Order Confirmed!</h1>
        <p className="confirmation-subtitle">
          Thank you for your order. We've received your request and will process it shortly.
        </p>
      </div>

      <div className="confirmation-content">
        {/* Order Details */}
        <div className="confirmation-card">
          <div className="card-header">
            <Package size={24} />
            <h2>Order Details</h2>
          </div>
          <div className="order-info">
            <div className="info-row">
              <span className="info-label">Order Number:</span>
              <span className="info-value">{order.order_number}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Amount:</span>
              <span className="info-value amount">GH₵{order.total_amount}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payment Method:</span>
              <span className="info-value">
                {order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Mobile Money'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Status:</span>
              <span className="status-badge pending">Pending</span>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="confirmation-card email-notice">
          <div className="card-header">
            <Mail size={24} />
            <h2>Check Your Email</h2>
          </div>
          <div className="notice-content">
            <p>
              We've sent a confirmation email to <strong>{order.email}</strong> with your order details.
            </p>
            <p className="notice-hint">
              If you don't see it in your inbox, please check your spam folder.
            </p>
          </div>
        </div>

        {/* Payment Instructions */}
        {paymentMethod === 'bank_transfer' && (
          <div className="confirmation-card payment-instructions">
            <h2>Complete Your Payment</h2>
            <p>Please transfer the exact amount to:</p>
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">Bank Name:</span>
                <span className="detail-value">Ghana Commercial Bank</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Name:</span>
                <span className="detail-value">Florence Dabrah Odjer</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Account Number:</span>
                <span className="detail-value">1021010060614</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value highlight">GH₵{order.total_amount}</span>
              </div>
            </div>
            <p className="payment-note">
              After payment, please send proof (screenshot) to our WhatsApp or email for confirmation.
            </p>
          </div>
        )}

        {paymentMethod === 'mobile_money' && (
          <div className="confirmation-card payment-instructions">
            <h2>Complete Your Payment</h2>
            <p>Send the exact amount via Mobile Money to:</p>
            <div className="payment-details">
              <div className="detail-row">
                <span className="detail-label">MTN:</span>
                <span className="detail-value">+233 54 489 3583</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">Florence Dabrah Odjer</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value highlight">GH₵{order.total_amount}</span>
              </div>
            </div>
            <p className="payment-note">
              After payment, please send confirmation SMS with your order number or whatsapp message.
            </p>
          </div>
        )}

        {/* Contact Information */}
        <div className="confirmation-card contact-info">
          <div className="card-header">
            <Phone size={24} />
            <h2>Need Help?</h2>
          </div>
          <div className="contact-content">
            <p>If you have any questions about your order, feel free to contact us:</p>
            <div className="contact-methods">
              <div className="contact-method">
                <strong>Phone:</strong> +233 54 489 3583
              </div>
              <div className="contact-method">
                <strong>Email:</strong> odjerflorence610@gmail.com
              </div>
              <div className="contact-method">
                <strong>Location:</strong> UHAS Campus, Ho, Volta Region
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order.items && order.items.length > 0 && (
          <div className="confirmation-card order-items">
            <h2>Your Items</h2>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="item-info">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-details">
                      Size: {item.size} | Qty: {item.quantity}
                    </span>
                  </div>
                  <span className="item-price">GH₵{item.total_price}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="confirmation-actions">
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
          <Link to="/track-order" className="btn btn-outline">
            Track Order
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;