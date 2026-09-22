import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store';
import './Navbar.css';
import logo from '../images/logo.png'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleCart, cartItemCount, isAdmin, logout } = useStore();
  const itemCount = cartItemCount ? cartItemCount() : 0;

  const navigate = useNavigate();

  const handleAdminClick = (e) => {
    if (!isAdmin) {
      e.preventDefault();
      navigate('/admin/login');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          {/* <span className="logo-text">Cropped By AYERKIE</span> */}
          <img src={logo} alt="Cropped By AYERKIE" className="navbar-logo-img" />
        </Link>

        <button 
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/about" className='navbar-link' onClick={() => setIsMenuOpen(false)}>
            About
          </Link>
          <Link to="/shop" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
            Shop
          </Link>
          {/* <Link 
            to="/admin" 
            className="navbar-link" 
            onClick={(e) => {
              handleAdminClick(e);
              setIsMenuOpen(false);
            }}
          >
            Admin
          </Link> */}
           {isAdmin && (
            <button className="navbar-link logout-btn" onClick={handleLogout}>
              Logout
            </button>
          )} 
        </div>

        <div className="navbar-actions">
          {/* <button className="navbar-icon-btn">
            <Search size={20} />
          </button> */}
          <Link 
            to={isAdmin ? "/admin" : "/admin/login"} 
            className="navbar-icon-btn"
            onClick={handleAdminClick}
          >
            {/* <User size={20} /> */}
          </Link>
          {/* {isAdmin && (
            <button className="navbar-icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          )} */}
          <button className="navbar-icon-btn cart-btn" onClick={toggleCart}>
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
