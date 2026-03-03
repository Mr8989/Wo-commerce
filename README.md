# Femme - Women's Fashion E-Commerce Platform

A full-stack e-commerce website built with **React** frontend and **Django** backend, specifically designed for women's fashion. Features anonymous user tracking, shopping cart, checkout, and a comprehensive admin dashboard.

## 🌟 Features

### Customer Features
- ✨ **No Login Required**: Browse and purchase without creating an account
- 🛍️ **Smart Cart**: Persistent shopping cart using browser fingerprinting
- 👗 **Beautiful Product Catalog**: Filter by category, search, and sort
- 💳 **Seamless Checkout**: Simple checkout process with order confirmation
- 📱 **Responsive Design**: Works perfectly on all devices
- 🎨 **Elegant UI**: Custom design with Playfair Display and Urbanist fonts

### Admin Features
- 📊 **Dashboard**: Real-time stats on orders, revenue, and inventory
- 📦 **Product Management**: View and manage all products
- 🛒 **Order Management**: Track and manage customer orders
- 📁 **Category Management**: Organize products by categories
- 👥 **Anonymous User Tracking**: See user data without requiring accounts

### Technical Features
- 🔐 **Browser Fingerprinting**: Track users across sessions using FingerprintJS
- 🗄️ **State Management**: Zustand for efficient React state management
- 🎯 **RESTful API**: Django REST Framework backend
- 💾 **Persistent Storage**: LocalStorage + backend synchronization
- 🚀 **Fast & Modern**: Vite for lightning-fast development

## 📁 Project Structure

```
womens-wear-ecommerce/
├── backend/                    # Django Backend
│   ├── womens_wear/           # Django Project
│   │   ├── settings.py        # Project settings
│   │   ├── urls.py            # Main URL configuration
│   │   └── wsgi.py            # WSGI configuration
│   ├── store/                 # Main App
│   │   ├── models.py          # Database models
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # API views
│   │   ├── urls.py            # App URLs
│   │   └── admin.py           # Admin configuration
│   ├── manage.py              # Django management
│   └── requirements.txt       # Python dependencies
│
└── frontend/                   # React Frontend
    ├── src/
    │   ├── components/        # Reusable components
    │   │   ├── Navbar.jsx
    │   │   ├── Cart.jsx
    │   │   └── Footer.jsx
    │   ├── pages/             # Page components
    │   │   ├── Home.jsx
    │   │   ├── Shop.jsx
    │   │   ├── ProductDetail.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── OrderConfirmation.jsx
    │   │   └── admin/         # Admin pages
    │   │       ├── Dashboard.jsx
    │   │       ├── Products.jsx
    │   │       ├── Orders.jsx
    │   │       └── Categories.jsx
    │   ├── store.js           # Zustand state management
    │   ├── api.js             # Axios configuration
    │   ├── App.jsx            # Main app component
    │   └── main.jsx           # Entry point
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (for admin access)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Load sample data (optional)**
   ```bash
   python manage.py shell
   ```
   
   Then in the Python shell:
   ```python
   from store.models import Category, Product
   
   # Create categories
   dresses = Category.objects.create(name='Dresses', slug='dresses', description='Elegant dresses for every occasion')
   tops = Category.objects.create(name='Tops', slug='tops', description='Stylish tops and blouses')
   bottoms = Category.objects.create(name='Bottoms', slug='bottoms', description='Pants, skirts, and shorts')
   outerwear = Category.objects.create(name='Outerwear', slug='outerwear', description='Coats and jackets')
   
   # Create sample products
   Product.objects.create(
       name='Floral Summer Dress',
       slug='floral-summer-dress',
       description='Beautiful floral print dress perfect for summer occasions',
       price=89.99,
       category=dresses,
       stock=25,
       available_sizes=['XS', 'S', 'M', 'L', 'XL'],
       is_featured=True,
       is_active=True,
       image_url='https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'
   )
   
   Product.objects.create(
       name='Classic White Blouse',
       slug='classic-white-blouse',
       description='Timeless white blouse for professional and casual wear',
       price=49.99,
       category=tops,
       stock=40,
       available_sizes=['XS', 'S', 'M', 'L', 'XL'],
       is_featured=True,
       is_active=True,
       image_url='https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=400'
   )
   
   Product.objects.create(
       name='High-Waist Denim Jeans',
       slug='high-waist-denim-jeans',
       description='Comfortable and stylish high-waist jeans',
       price=79.99,
       category=bottoms,
       stock=30,
       available_sizes=['XS', 'S', 'M', 'L', 'XL'],
       is_featured=False,
       is_active=True,
       image_url='https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400'
   )
   
   exit()
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```
   
   Backend will be available at: `http://localhost:8000`
   Admin panel at: `http://localhost:8000/admin`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file (optional)**
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:8000/api" > .env
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at: `http://localhost:3000`

## 🎯 Key Technologies

### Backend
- **Django 5.0**: Web framework
- **Django REST Framework**: API development
- **django-cors-headers**: CORS support
- **Pillow**: Image processing
- **SQLite**: Database (easily switchable to PostgreSQL)

### Frontend
- **React 18**: UI library
- **React Router**: Navigation
- **Zustand**: State management
- **Axios**: HTTP client
- **FingerprintJS**: Browser fingerprinting
- **Lucide React**: Icons
- **Vite**: Build tool

## 🔐 How Anonymous User Tracking Works

The system uses **browser fingerprinting** to track users without requiring login:

1. **Fingerprint Generation**: When a user visits, FingerprintJS creates a unique identifier based on browser/device characteristics
2. **Backend Association**: This fingerprint is sent to the backend to create/retrieve an `AnonymousUser` record
3. **Cart Persistence**: Cart items are associated with the fingerprint
4. **Order Tracking**: Orders can be linked back to the anonymous user
5. **User Info Collection**: During checkout, we collect email, name, and phone which are saved for future visits

## 📊 Database Models

### Category
- name, slug, description
- One-to-many with Products

### Product
- name, slug, description, price
- ForeignKey to Category
- image, stock, available_sizes
- is_featured, is_active flags

### AnonymousUser
- fingerprint (unique identifier)
- email, first_name, last_name, phone
- Tracks users without accounts

### Order
- order_number (auto-generated)
- ForeignKey to AnonymousUser
- Customer info (email, name, phone)
- Shipping address
- total_amount, status
- One-to-many with OrderItems

### OrderItem
- ForeignKey to Order and Product
- quantity, size, price

### CartItem
- ForeignKey to AnonymousUser and Product
- quantity, size

## 🎨 Design System

### Colors
- **Primary**: `#2C1810` (Dark Brown)
- **Secondary**: `#D4AF37` (Gold)
- **Accent**: `#8B4513` (Saddle Brown)
- **Background**: `#FFF8F0` (Cream)
- **Text**: `#2C1810` (Dark Brown)

### Typography
- **Display Font**: Playfair Display (headings)
- **Body Font**: Urbanist (body text)

## 🛠️ API Endpoints

### Products
- `GET /api/products/` - List all products
- `GET /api/products/{slug}/` - Get product details
- `GET /api/products/featured/` - Get featured products

### Categories
- `GET /api/categories/` - List all categories
- `GET /api/categories/{slug}/` - Get category details

### Cart
- `GET /api/cart/?fingerprint={fp}` - Get cart items
- `POST /api/cart/` - Add item to cart
- `DELETE /api/cart/{id}/` - Remove item
- `POST /api/cart/clear/` - Clear cart

### Orders
- `GET /api/orders/` - List orders (admin)
- `POST /api/orders/` - Create new order
- `GET /api/orders/stats/` - Get order statistics

### Anonymous Users
- `POST /api/users/get_or_create/` - Get or create anonymous user

## 🚀 Deployment

### Backend (Django)

**Option 1: Heroku**
```bash
# Install Heroku CLI and login
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set DJANGO_SETTINGS_MODULE=womens_wear.settings
heroku config:set SECRET_KEY='your-secret-key'

# Deploy
git push heroku main
heroku run python manage.py migrate
heroku run python manage.py createsuperuser
```

**Option 2: DigitalOcean/AWS**
- Use Gunicorn as WSGI server
- Configure Nginx as reverse proxy
- Set up PostgreSQL database
- Configure static/media file serving

### Frontend (React)

**Option 1: Vercel**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel
```

**Option 2: Netlify**
```bash
# Build
npm run build

# Deploy dist/ folder via Netlify CLI or web interface
```

Update `VITE_API_URL` in `.env` to point to your production backend URL.

## 📝 Environment Variables

### Backend (.env)
```
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:pass@localhost/dbname
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-api.com/api
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Unsplash for placeholder images
- Google Fonts for typography
- FingerprintJS for anonymous user tracking
- The amazing open-source community

## 💡 Future Enhancements

- [ ] Payment integration (Stripe, PayPal)
- [ ] Email notifications for orders
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced filtering and search
- [ ] Size guide
- [ ] Product recommendations
- [ ] Inventory management
- [ ] Sales and discount system
- [ ] Multi-language support

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy Coding! 💻✨**
