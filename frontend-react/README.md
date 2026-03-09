# 🚀 CampusLens: Student Feedback Visualization System

CampusLens is a comprehensive institutional analytics platform designed to bridge the gap between student feedback and institutional improvement. It provides real-time visualization, sentiment analysis, and role-based dashboards to help educational leaders make data-driven decisions.

---

## ✨ Key Features

-   **Multi-Role Dashboards:** Tailored interfaces for Admin, Dean, Principal, Faculty, Students, and Domain Incharges (Mess, Transport, Hostel, Sanitation).
-   **Real-Time Analytics:** Live data visualization using Chart.js with automatic updates via Socket.io.
-   **Sentiment Analysis:** NLP-driven feedback categorization to identify student concerns automatically.
-   **Automated Reporting:** Generate PDF reports for departments and faculty performance using PDFKit and jsPDF.
-   **Domain-Specific Monitoring:** Dedicated tracking for essential services like Hostel, Mess, and Transport.
-   **Secure Authentication:** Robust RBAC (Role-Based Access Control) with JWT and bcrypt encryption.

---

## 🛠️ Technology Stack

### Frontend
-   **Core:** React.js (v19)
-   **Styling:** Modern CSS with dark mode support and Glassmorphism.
-   **Icons & Animations:** Lucide React, React Icons, Framer Motion.
-   **Data Visualization:** Chart.js, React-Chartjs-2.
-   **State Management:** React Context API (AuthContext).
-   **Routing:** React Router DOM (v7).
-   **Real-time:** Socket.io-client.

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js (v5)
-   **Database:** MongoDB with Mongoose ODM.
-   **Security:** JSON Web Tokens (JWT), Bcrypt.js.
-   **File Handling:** Multer (for CSV/Image uploads).
-   **NLP:** Natural, Sentiment, Stopword.
-   **PDF Generation:** PDFKit.

---

## 📂 Project Structure

```text
feedback_visualization_system/
├── frontend-react/       # React application (Client-side)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── context/      # Auth & Global state
│   │   ├── pages/        # Role-based dashboard pages
│   │   └── assets/       # Styles and images
├── backend/              # Node.js Express server (API)
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API endpoints
│   ├── controllers/      # Business logic
│   └── scripts/          # Database seeding and utilities
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd feedback_visualization_system
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file with MONGO_URI and JWT_SECRET
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend-react
   npm install
   npm start
   ```

---

## 🔐 Credentials
For testing purposes, refer to the [LOGIN_GUIDE.md](./LOGIN_GUIDE.md) for pre-seeded user accounts for all roles.

---

## 📊 Dashboard Documentation
Detailed implementation notes can be found in [DASHBOARD_FIXES_SUMMARY.md](./DASHBOARD_FIXES_SUMMARY.md).
