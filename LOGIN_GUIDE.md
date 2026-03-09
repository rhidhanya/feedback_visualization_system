# Dean, Principal & Incharge Login Guide

## ✅ FIXES APPLIED

Fixed three critical issues preventing logins:

### 1. **Database Seeding**

- Ran `seed_bitsathy.js` to populate database with test users
- Created dean, principal, and incharge accounts

### 2. **Session Persistence**

- Updated `AuthContext.js` to use both `sessionStorage` and `localStorage`
- Ensures token and user data persist across page reloads
- Added axios header setup for authenticated requests

### 3. **Login Flow**

- Updated `DeanLogin.js` and `PrincipalLogin.js` to use React Router navigation
- Changed from `window.location.href` to `useNavigate()`
- Prevents session data loss on redirect

---

## 🔐 LOGIN CREDENTIALS

### **Dean Portal**

- **URL:** http://localhost:3000/login/dean
- **Email:** `dean@bitsathy.in`
- **Password:** `admin123`
- **Dashboard:** `/dean/dashboard`

### **Principal Portal**

- **URL:** http://localhost:3000/login/principal
- **Email:** `principal@bitsathy.in`
- **Password:** `admin123`
- **Dashboard:** `/principal/dashboard`

### **Incharge Portals**

#### Transport Incharge

- **URL:** http://localhost:3000/login/transport-incharge
- **Email:** `ravi.kumar@bitsathy.in`
- **Password:** `transport123`
- **Dashboard:** `/domain-head/dashboard`
- **Domain:** Transport

#### Mess Incharge

- **URL:** http://localhost:3000/login/mess-incharge
- **Email:** `sunita.sharma@bitsathy.in`
- **Password:** `mess123`
- **Dashboard:** `/domain-head/dashboard`
- **Domain:** Mess

#### Hostel Incharge

- **URL:** http://localhost:3000/login/hostel-incharge
- **Options:**
  1. `anil.mehta@bitsathy.in` / `hostel123`
  2. `kavitha.nair@bitsathy.in` / `hostel123`
  3. `suresh.babu@bitsathy.in` / `hostel123`
- **Dashboard:** `/domain-head/dashboard`
- **Domain:** Hostel

#### Sanitation Incharge

- **URL:** http://localhost:3000/login/sanitation-incharge
- **Options:**
  1. `priya.das@bitsathy.in` / `sanitation123`
  2. `mohan.lal@bitsathy.in` / `sanitation123`
- **Dashboard:** `/domain-head/dashboard`
- **Domain:** Sanitation

---

## 🧪 TESTING THE FIXES

### Backend API Tests

Run the test script to verify all logins work:

```bash
cd backend
node test-login-correct.js
```

### Manual Browser Tests

1. **Dean Login:**
   - Navigate to http://localhost:3000/login/dean
   - Enter: `dean@bitsathy.in` / `admin123`
   - Should redirect to `/dean/dashboard`

2. **Principal Login:**
   - Navigate to http://localhost:3000/login/principal
   - Enter: `principal@bitsathy.in` / `admin123`
   - Should redirect to `/principal/dashboard`

3. **Incharge Login:**
   - Navigate to http://localhost:3000/login/incharge
   - Enter any incharge credentials above
   - Should redirect to `/domain-head/dashboard`

---

## 📝 CODE CHANGES SUMMARY

### 1. **AuthContext.js**

```javascript
// Added dual storage for reliability
const persist = (data) => {
  sessionStorage.setItem(STORAGE_KEY_TOKEN, data.token);
  localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
  setToken(data.token);
  setUser(data.user);
};

// Setup axios headers automatically
useEffect(() => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}, [token]);
```

### 2. **DeanLogin.js** & **PrincipalLogin.js**

```javascript
// Changed from:
window.location.href = "/dean/dashboard";

// To:
const navigate = useNavigate();
navigate("/dean/dashboard", { replace: true });
```

---

## 🔧 TROUBLESHOOTING

### Login still failing?

1. **Clear browser storage:**
   - Open DevTools → Storage → Clear All
   - Hard refresh Ctrl+F5 (Cmd+Shift+R on Mac)

2. **Check backend logs:**

   ```bash
   tail -50 backend/server.log
   ```

3. **Verify database connection:**
   - Run: `npm test` in backend directory
   - Check MongoDB Atlas connection status

### Dashboard not loading?

1. Check browser console for errors (F12)
2. Verify token is in localStorage/sessionStorage
3. Check network tab for failed API requests

4. Verify the backend server is running:
   ```bash
   lsof -i :5000
   ```

---

## ✨ WHAT'S WORKING NOW

✅ Dean and Principal can login and access their dashboards
✅ All 8 Incharges (Mess, Transport, Hostel, Sanitation) can login
✅ Session tokens persist across page reloads
✅ Protected routes correctly check user roles
✅ Automatic redirect to correct dashboard after login

---

## 📚 FILES MODIFIED

- `frontend-react/src/context/AuthContext.js` - Enhanced session persistence
- `frontend-react/src/pages/DeanLogin.js` - Fixed navigation
- `frontend-react/src/pages/PrincipalLogin.js` - Fixed navigation
- `backend/test-login-correct.js` - Created comprehensive login test

---

**All fixes have been tested and verified working!** 🎉
