import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import './Cart.css';

function Cart() {
  const { 
    cart, 
    isCartOpen, 
    toggleCart, 
    removeFromCart, 
    updateCartItemQuantity,
    cartTotal 
  } = useStore();

  const total = cartTotal();

  return (
    <>
      <div className={`cart-overlay ${isCartOpen ? 'active' : ''}`} onClick={toggleCart} />
      <div className={`cart ${isCartOpen ? 'active' : ''}`}>
        <div className="cart-header">
          <h3>Shopping Bag</h3>
          <button className="cart-close" onClick={toggleCart}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag size={64} strokeWidth={1} />
              <p>Your bag is empty</p>
              <button className="btn btn-primary" onClick={toggleCart}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="cart-item">
                    <div className="cart-item-image">
                      <img 
                        src={item.product.image_display || item.product.image_url || 'https://via.placeholder.com/100'} 
                        alt={item.product.name}
                      />
                    </div>
                    <div className="cart-item-details">
                      <h4>{item.product.name}</h4>
                      {item.size && <p className="cart-item-size">Size: {item.size}</p>}
                      <p className="cart-item-price">₵{item.product.price}</p>
                      
                      <div className="cart-item-quantity">
                        <button 
                          onClick={() => updateCartItemQuantity(item.product.id, item.size, Math.max(1, item.quantity - 1))}
                          className="quantity-btn"
                        >
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => updateCartItemQuantity(item.product.id, item.size, item.quantity + 1)}
                          className="quantity-btn"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <button 
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.product.id, item.size)}
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span>Subtotal</span>
                  <span className="cart-total-amount">₵{total.toFixed(2)}</span>
                </div>
                <Link 
                  to="/checkout" 
                  className="btn btn-primary btn-checkout"
                  onClick={toggleCart}
                >
                  Proceed to Checkout
                </Link>
                <button className="btn btn-outline" onClick={toggleCart}>
                  Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Cart;
