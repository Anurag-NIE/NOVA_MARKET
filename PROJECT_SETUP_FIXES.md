# Project Setup & Blank Screen Fixes

## ✅ Issues Fixed

### 1. Missing Imports in App.js
- **Problem**: `HomeDualMarketplace`, `ProductsPage`, `ProductDetail`, `ServicesPage`, `ServiceDetail`, and `CartPage` were used but not imported
- **Fix**: Added all missing imports

### 2. Path Alias Issue in index.js
- **Problem**: Using `@/index.css` and `@/App` which requires path aliases configuration
- **Fix**: Changed to relative imports: `./index.css` and `./App`

### 3. Missing Toaster Component
- **Problem**: Toaster imported but not rendered
- **Fix**: Added `<Toaster position="top-right" />` to App component

---

## 🚀 Running the Project

### Backend Setup (Terminal 1)

```powershell
# Navigate to backend
cd backend

# Activate virtual environment (if not already activated)
.venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run the server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

**Backend will run at:** `http://localhost:8000`

---

### Frontend Setup (Terminal 2)

```powershell
# Navigate to frontend
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm start
```

**Frontend will run at:** `http://localhost:3000`

---

## 🔍 Common Issues & Solutions

### Issue 1: Blank Screen / White Screen

**Possible Causes:**
1. ❌ Missing imports in App.js
2. ❌ Path alias not configured
3. ❌ JavaScript errors in browser console
4. ❌ Backend not running

**Solutions:**
- ✅ Check browser console (F12) for errors
- ✅ Verify all imports in App.js
- ✅ Use relative imports instead of path aliases
- ✅ Ensure backend is running on port 8000

### Issue 2: CORS Errors

**Solution:** Backend CORS is already configured, but if you see errors:
```python
# In backend/server.py - already configured
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    ...
)
```

### Issue 3: API Connection Errors

**Check:**
1. Backend is running on `http://localhost:8000`
2. Frontend API base URL in `frontend/src/utils/api.js`:
   ```javascript
   const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/api";
   ```

### Issue 4: Environment Variables

**Backend `.env` should have:**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=novomarket
JWT_SECRET=your-secret-key-here
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Testing the Setup

1. **Start Backend:**
   ```powershell
   cd backend
   .venv\Scripts\activate
   uvicorn server:app --reload
   ```
   Should see: `Uvicorn running on http://127.0.0.1:8000`

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm start
   ```
   Should open: `http://localhost:3000`

3. **Check Browser:**
   - Open `http://localhost:3000`
   - Should see the dual marketplace homepage
   - Check browser console (F12) for any errors

---

## 📋 Quick Command Reference

### Windows PowerShell Commands

```powershell
# Backend
cd backend
.venv\Scripts\activate
uvicorn server:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## ✅ Verification Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 3000
- [ ] No errors in browser console (F12)
- [ ] Homepage loads with dual marketplace view
- [ ] Can navigate to /products and /services
- [ ] MongoDB connected (check backend logs)

---

## 🐛 Debug Steps

If you still see a blank screen:

1. **Open Browser Console (F12)**
   - Look for red errors
   - Check for import/module errors

2. **Check Network Tab**
   - Verify API calls to `http://localhost:8000/api`
   - Check for 404 or CORS errors

3. **Backend Logs**
   - Check terminal running uvicorn
   - Look for error messages

4. **Verify Files Exist**
   - `frontend/src/App.js` exists
   - `frontend/src/pages/HomeDualMarketplace.jsx` exists
   - All imported components exist

5. **Clear Cache**
   ```powershell
   # In frontend directory
   npm start -- --reset-cache
   ```

---

## 📝 Notes

- All missing imports have been added to `App.js`
- Path aliases removed from `index.js` (using relative imports)
- Toaster component added for notifications
- All routes are properly configured

The project should now load correctly! 🎉

