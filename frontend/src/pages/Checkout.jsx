import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet } from 'lucide-react';
import { useStore, getFingerprint } from '../store';
import api from '../api';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart, userInfo, setUserInfo } = useStore();
  
  const [formData, setFormData] = useState({
    email: userInfo?.email || '',
    firstName: userInfo?.firstName || '',
    lastName: userInfo?.lastName || '',
    phone: userInfo?.phone || '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryPostalCode: '',
    deliveryCountry: 'Ghana',
    notes: '',
    paymentMethod: 'bank_transfer',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Payment methods (removed cash on delivery)
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
  ];

  // Validate Ghana phone number
  const validateGhanaPhone = (phone) => {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const ghanaPhoneRegex = /^(\+233|0)(2[0-9]|5[0-9])[0-9]{7}$/;
    return ghanaPhoneRegex.test(cleanPhone);
  };

  // Format phone number
  const formatPhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('0')) {
      return '+233' + cleanPhone.substring(1);
    }
    if (cleanPhone.startsWith('+233')) {
      return cleanPhone;
    }
    return '+233' + cleanPhone;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'phone') {
      setPhoneError('');
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone && !validateGhanaPhone(formData.phone)) {
      setPhoneError('Please enter a valid Ghana phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone
    if (!validateGhanaPhone(formData.phone)) {
      setError('Please enter a valid Ghana phone number');
      setPhoneError('Invalid phone number format');
      setLoading(false);
      return;
    }

    try {
      const fingerprint = await getFingerprint();
      const formattedPhone = formatPhoneNumber(formData.phone);
      
      const orderData = {
        fingerprint,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formattedPhone,
        delivery_address: formData.deliveryAddress,
        delivery_city: formData.deliveryCity,
        delivery_state: formData.deliveryState,
        delivery_postal_code: formData.deliveryPostalCode,
        delivery_country: formData.deliveryCountry,
        total_amount: cartTotal(),
        payment_method: formData.paymentMethod,
        notes: formData.notes,
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
        phone: formattedPhone,
      });

      clearCart();
      navigate(`/order-confirmation/${response.data.order_number}`, {
        state: { paymentMethod: formData.paymentMethod }
      });
    } catch (err) {
      console.error('Order error:', err);
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="checkout container fade-in">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checking out.</p>
          <button onClick={() => navigate('/shop')} className="btn btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout container fade-in">
      <h1>Checkout</h1>

      <div className="checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form">
          {error && <div className="error-message">{error}</div>}

          {/* Contact Information */}
          <section className="form-section">
            <h2>Contact Information</h2>
            <div className="input-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="input-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                placeholder="024 123 4567 or +233 24 123 4567"
                required
                className={phoneError ? 'error' : ''}
              />
              {phoneError && <span className="field-error">{phoneError}</span>}
              <small className="field-hint">
                Ghana mobile numbers only (MTN, Vodafone, AirtelTigo)
              </small>
            </div>
          </section>

          {/* Delivery Address */}
          <section className="form-section">
            <h2>Delivery Address</h2>
            <div className="input-group">
              <label>Address *</label>
              <input
                type="text"
                name="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-2">
              <div className="input-group">
                <label>City *</label>
                <input
                  type="text"
                  name="deliveryCity"
                  value={formData.deliveryCity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label>State/Region *</label>
                <input
                  type="text"
                  name="deliveryState"
                  value={formData.deliveryState}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-2">
              <div className="input-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="deliveryPostalCode"
                  value={formData.deliveryPostalCode}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <label>Country *</label>
                <input
                  type="text"
                  name="deliveryCountry"
                  value={formData.deliveryCountry}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="form-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method ${formData.paymentMethod === method.id ? 'selected' : ''}`}
                  data-method={method.id}
                  onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                >
                  <div className="payment-icon">
                    {method.icon}
                  </div>
                  <h3>{method.name}</h3>
                  <p>{method.description}</p>
                </div>
              ))}
            </div>

            {/* Payment Instructions */}
            {formData.paymentMethod === 'bank_transfer' && (
              <div className="payment-instructions">
                <h4>Bank Transfer Details</h4>
                <div className="payment-details">
                  <p><strong>Bank Name:</strong> Ghana Commercial Bank</p>
                  <p><strong>Account Name:</strong>Florence Dabrah Odjer </p>
                  <p><strong>Account Number:</strong> 1021010060614</p>
                  <p><strong>Branch:</strong> Ho Branch</p>
                </div>
                <p className="payment-note">
                  Please transfer the exact amount and send proof of payment to our email or WhatsApp.
                </p>
              </div>
            )}

            {formData.paymentMethod === 'mobile_money' && (
              <div className="payment-instructions">
                <h4>Mobile Money Details</h4>
                <div className="payment-details">
                  <p><strong>MTN:</strong> +233 54 489 3583</p>
                  <p><strong>Name:</strong> Florence Dabrah Odjer</p>
                </div>
                <p className="payment-note">
                  Send exact amount to the number above and send confirmation SMS or WhatsApp message.
                </p>
              </div>
            )}
          </section>

          {/* Order Notes */}
          <section className="form-section">
            <h2>Order Notes (Optional)</h2>
            <div className="input-group">
              <label>Additional Information</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any special instructions for your order?"
              />
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Processing...' : `Place Order - GH₵${cartTotal()}`}
          </button>
        </form>

        {/* Order Summary */}
        <aside className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cart.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="summary-item">
                <img src={item.product.image_display || item.product.image_url} alt={item.product.name} />
                <div className="summary-item-details">
                  <h4>{item.product.name}</h4>
                  <p>Size: {item.size} | Qty: {item.quantity}</p>
                  <p className="summary-item-price">GH₵{item.product.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>GH₵{cartTotal()}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              {/* <span>Free</span> */}
            </div>
            <div className="summary-row total">
              <strong>Total</strong>
              <strong>GH₵{cartTotal()}</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;