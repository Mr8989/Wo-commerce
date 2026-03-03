import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import api from '../api';
import './OrderConfirmation.css';

function OrderConfirmation() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/?search=${orderNumber}`);
        if (response.data.results && response.data.results.length > 0) {
          setOrder(response.data.results[0]);
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  return (
    <div className="order-confirmation container fade-in">
      <div className="confirmation-card">
        <CheckCircle size={64} className="success-icon" />
        <h1>Order Confirmed!</h1>
        <p className="confirmation-message">
          Thank you for your order. We've sent a confirmation email to{' '}
          {order?.email}
        </p>
        
        <div className="order-details">
          <h2>Order Details</h2>
          <p><strong>Order Number:</strong> {orderNumber}</p>
          {order && (
            <>
              <p><strong>Total:</strong> ₵{order.total_amount}</p>
              <p><strong>Status:</strong> <span className="status-badge">{order.status}</span></p>
            </>
          )}
        </div>

        <div className="confirmation-actions">
          <Link to="/shop" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderConfirmation;
