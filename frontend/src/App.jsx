import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useStore } from './store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Cart from './components/Cart';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// The storefront routes above are what every visitor needs on first paint.
// Everything else — the whole admin dashboard in particular — loads only once
// someone navigates there, which keeps the initial download small.
const About = lazy(() => import('./pages/About'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Policy = lazy(() => import('./pages/Policy'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

function App() {
  const {verifyAdmin, logout} = useStore();

  useEffect(() => {
    verifyAdmin()
  }, [verifyAdmin])

  // api.js fires this when an admin request comes back 401 (expired token).
  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener('admin-session-expired', onExpired);
    return () => window.removeEventListener('admin-session-expired', onExpired);
  }, [logout])

  return (
    <Router>
      <div className="app">
        <Navbar />
        <Cart />
        <main className="main-content">
          <Suspense fallback={<div className="loading">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/about' element={<About/>}/>
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/faq" element={<Policy policy="faq" />} />
            <Route path="/terms" element={<Policy policy="terms" />} />
            <Route path="/privacy" element={<Policy policy="privacy" />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
