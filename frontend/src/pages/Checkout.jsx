import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign, Wallet } from 'lucide-react';
import { useStore, getFingerprint } from '../store';
import api from '../api';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, userInfo, setUserInfo } = useStore();
  const [formData, setFormData] = useState({
    email: userInfo.email || '',
    firstName: userInfo.firstName || '',
    lastName: userInfo.lastName || '',
    phone: userInfo.phone || '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPostalCode: '',
    shippingCountry: '',
    notes: '',
    paymentMethod: 'bank_transfer',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: <CreditCard size={24} />,
      description: 'Transfer to our bank account',
    },
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: <Wallet size={24} />,
      description: 'MTN, Vodafone, AirtelTigo',
    },
    {
      id: 'cash_on_delivery',
      name: 'Cash on Delivery',
      icon: <DollarSign size={24} />,
      description: 'Pay when you receive',
    },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const fingerprint = await getFingerprint();
      
      const orderData = {
        fingerprint,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        delivery_address: formData.deliveryAddress,
        delivery_city: formData.deliveryCity,
        delivery_state: formData.deliveryState,
        delivery_postal_code: formData.deliveryPostalCode,
        delivery_country: formData.deliveryCountry,
        notes: formData.notes,
        payment_method: formData.paymentMethod,
        total_amount: cartTotal(),
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          size: item.size,
          price: item.product.price,
        })),
      };

      const response = await api.post('/orders/', orderData);
      
      setUserInfo({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      clearCart();
      navigate(`/order-confirmation/${response.data.order_number}`, {
        state: { paymentMethod: formData.paymentMethod }
      });
    } catch (err) {
      setError('Failed to place order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout container">
        <div className="empty-cart-message">
          <h2>Your cart is empty</h2>
          <button className="btn btn-primary" onClick={() => navigate('/shop')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout container fade-in">
      <h1>Checkout</h1>
      
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Contact Information</h2>
            <div className="grid grid-2">
              <div className="input-group">
                <label>First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label>Phone *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
          </section>

          <section className="form-section">
            <h2>Delivery Address</h2>
            <div className="input-group">
              <label>Address *</label>
              <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required />
            </div>
            <div className="grid grid-2">
              <div className="input-group">
                <label>City *</label>
                <input type="text" name="deliveryCity" value={formData.deliveryCity} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>State/Province *</label>
                <input type="text" name="deliveryState" value={formData.deliveryState} onChange={handleChange} required />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="input-group">
                <label>Postal Code *</label>
                <input type="text" name="deliveryPostalCode" value={formData.deliveryPostalCode} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Country *</label>
                <input type="text" name="deliveryCountry" value={formData.deliveryCountry} onChange={handleChange} required />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <label key={method.id} className={`payment-method ${formData.paymentMethod === method.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={formData.paymentMethod === method.id}
                    onChange={handleChange}
                  />
                  <div className="payment-method-content">
                    <div className="payment-icon">{method.icon}</div>
                    <div className="payment-details">
                      <h4>{method.name}</h4>
                      <p>{method.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {formData.paymentMethod === 'bank_transfer' && (
              <div className="payment-instructions">
                <h4>Bank Transfer Instructions</h4>
                <p>Please transfer to:</p>
                <ul>
                  <li><strong>Bank:</strong> Ghana Commercial Bank</li>
                  <li><strong>Account Name:</strong> Florence Dabrah Odjer</li>
                  <li><strong>Account Number:</strong>1021010060614 </li>
                </ul>
                <p className="note">Send proof of payment to whatsApp number: 0544893583</p>
              </div>
            )}

            {formData.paymentMethod === 'mobile_money' && (
              <div className="payment-instructions">
                <h4>Mobile Money Instructions</h4>
                <p>Send payment to:</p>
                <ul>
                  <li><strong>MTN:</strong> 0544893583</li>
                  <li><strong>Name:</strong>Florence Dabrah Odjer</li>
                </ul>
                <p className="note">Send proof of payment to whatsApp number: 0544893583</p>
              </div>
            )}

            {formData.paymentMethod === 'cash_on_delivery' && (
              <div className="payment-instructions">
                <h4>Cash on Delivery</h4>
                <p>Pay with cash when your order is delivered.</p>
                <ul>
                  <li>Have exact amount ready</li>
                  <li>Payment to delivery agent</li>
                  <li>Receipt will be provided</li>
                </ul>
              </div>
            )}

            <div className="input-group">
              <label>Order Notes (Optional)</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Special instructions or delivery notes..." />
            </div>
          </section>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary btn-place-order" disabled={loading}>
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="summary-item">
                <div className="summary-item-details">
                  <p className="summary-item-name">{item.product.name}</p>
                  <p className="summary-item-meta">Size: {item.size} × {item.quantity}</p>
                </div>
                <p className="summary-item-price">₵{(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span className="total-amount">₵{cartTotal().toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
