# NOVA_MARKET

A full-stack dual marketplace platform combining product e-commerce (Amazon-style) and service marketplace (Fiverr-style) capabilities.

## 🚀 Project Overview

NovaMarket is a comprehensive marketplace platform that allows users to:
- **Buy and sell products** with shopping cart functionality
- **Book and offer services** with a freelance marketplace
- **Post service requests** and receive proposals from freelancers
- **Real-time communication** between buyers and sellers
- **Analytics dashboard** for sellers to track sales and performance

## ✨ Key Features

### Product Marketplace
- Product listings with categories, filters, and search
- Shopping cart management
- Secure checkout with Stripe payment integration
- Order tracking and management
- Product reviews and ratings

### Service Marketplace
- Service listings with portfolios
- Direct service booking
- Service request board
- Proposal system for freelancers
- Booking status management

### User Features
- JWT-based authentication with role-based access (Buyer/Seller)
- Real-time chat between users
- Notification system
- Analytics dashboard for sellers
- Dark mode support
- Fully responsive design

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router DOM 7** - Routing
- **Tailwind CSS 3** - Styling
- **Radix UI** - Accessible components
- **Framer Motion** - Animations
- **Axios** - HTTP client
- **React Hook Form + Zod** - Form handling
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python web framework
- **MongoDB + Motor** - Database with async driver
- **Redis** - Caching
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Bcrypt** - Password hashing
- **WebSockets** - Real-time communication
- **Pydantic** - Data validation

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (optional, for caching)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Anurag-NIE/NOVA_MARKET.git
cd NOVA_MARKET
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Backend Environment Configuration

Create a `.env` file in the `backend` directory:

```env
# Database
MONGO_URL=mongodb://localhost:27017/
DB_NAME=MarketPlace

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_API_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 4. Frontend Setup

```bash
cd frontend
npm install
# or
yarn install
```

### 5. Frontend Environment Configuration

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 🚀 Running the Project

### Terminal 1 - Backend

```bash
cd backend
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac
uvicorn server:app --reload
```

Backend will run at `http://localhost:8000`

### Terminal 2 - Frontend

```bash
cd frontend
npm start
# or
yarn start
```

Frontend will run at `http://localhost:3000`

## 📁 Project Structure

```
NOVA_MARKET/
├── backend/
│   ├── server.py                    # Main FastAPI application
│   ├── config.py                     # Configuration
│   ├── database.py                   # MongoDB connection
│   ├── models.py                     # Base models
│   ├── models_dual_marketplace.py    # Product & Service models
│   ├── models_reviews.py             # Review models
│   ├── routes/
│   │   ├── marketplace.py           # Core routes
│   │   ├── products.py              # Product routes
│   │   ├── services.py              # Service routes
│   │   ├── checkout.py               # Stripe checkout
│   │   ├── reviews.py                # Review routes
│   │   ├── booking_routes.py         # Booking management
│   │   ├── service_request_routes.py # Service requests
│   │   └── freelancer_routes.py    # Freelancer profiles
│   ├── services/                     # Business logic services
│   └── utils/                        # Utility functions
│
├── frontend/
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   ├── components/              # Reusable components
│   │   ├── utils/                   # Utility functions
│   │   └── App.js                   # Main app component
│   └── package.json
│
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Products
- `GET /api/products` - List products (with filters)
- `POST /api/products/add` - Add product (seller)
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/cart/add` - Add to cart
- `GET /api/products/cart` - Get cart
- `GET /api/products/orders` - Get orders

### Services
- `GET /api/services` - List services
- `POST /api/services/add` - Add service (seller)
- `GET /api/services/:id` - Get service details
- `POST /api/services/bookings/create` - Create booking
- `GET /api/services/bookings/my-bookings` - Get bookings

### Checkout
- `POST /api/checkout/create-session` - Create Stripe session
- `POST /api/checkout/webhook/stripe` - Stripe webhook

### Service Requests
- `POST /api/service-requests` - Create service request
- `GET /api/service-requests` - List service requests
- `POST /api/service-requests/:id/proposals` - Submit proposal

**API Documentation:** Visit `http://localhost:8000/docs` for interactive API docs

## 👥 User Roles

### Buyer
- Browse and purchase products
- Book services
- Post service requests
- Receive and manage proposals
- Track orders and bookings
- Chat with sellers

### Seller
- Add/edit/delete products and services
- Manage inventory
- View orders and bookings
- Respond to service requests
- Update booking status
- Access analytics dashboard

## 💳 Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from [Dashboard](https://dashboard.stripe.com/apikeys)
3. Add keys to `backend/.env`
4. For webhooks (local development):
   ```bash
   stripe login
   stripe listen --forward-to localhost:8000/api/checkout/webhook/stripe
   ```

## 🗄️ Database

### MongoDB Collections
- `users` - User accounts
- `products` - Product listings
- `services` - Service listings
- `orders` - Product orders
- `bookings` - Service bookings
- `cart` - Shopping cart items
- `reviews` - Reviews and ratings
- `messages` - Chat messages
- `service_requests` - Posted service requests
- `proposals` - Freelancer proposals

## 🎨 Features in Detail

- **Dual Marketplace**: Separate flows for products (cart-based) and services (direct booking)
- **Real-time Chat**: WebSocket-based messaging
- **Payment Processing**: Secure Stripe integration
- **Analytics**: Sales and views tracking for sellers
- **Service Request Board**: Post requests and receive proposals
- **Responsive Design**: Mobile-first, works on all devices
- **Dark Mode**: Theme switching support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the code structure
- Open an issue on GitHub

## 🙏 Acknowledgments

Built with React, FastAPI, and MongoDB.

---

**Made with ❤️ by Anurag-NIE**

