import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore, getFingerprint } from './store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import About from './pages/About';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCategories from './pages/admin/Categories';
import TrackOrder from './pages/TrackOrder';
import AdminSettings from './pages/admin/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const setUserFingerprint = useStore(state => state.setUserFingerprint);
  const {verifyAdmin} = useStore();

  useEffect(() => {
    // Initialize user fingerprint
    getFingerprint().then(fp => {
      setUserFingerprint(fp);
    });
  }, [setUserFingerprint]);

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Cart />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/about' element={<About/>}/>
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/track-order" element={<TrackOrder />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
