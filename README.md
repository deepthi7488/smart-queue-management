# Smart Queue Management System for Hospital Management

> **Design Thinking & Engineering (DT&E) Academic Project**  
> Computer Science & Engineering • 2nd Year B.Tech / B.E.

---

## 📌 Problem Statement & Objective

In healthcare facilities, patient waiting times are often unpredictable. When a doctor arrives late or consultations take longer than planned, entire queues experience cascading delays. Patients wait with no visibility into true queue dynamics.

The **Smart Queue Management System** addresses this problem by providing:
- **Unified Queue Model**: Online token bookings and offline walk-in tokens enter the exact same synchronized queue.
- **Dynamic Queue Recalculation**: Automatically shifts estimated waiting times and token slots when doctor delays, consultation overruns, cancellations, or missed turns occur.
- **Dedicated Portals**:
  - **Patient Portal**: Online token booking, live queue position tracking, estimated wait time in minutes, appointment history, token cancellation.
  - **Admin/Receptionist Portal**: Real-time consultation controls ("Call Next", "Complete Consultation", "Mark Missed"), doctor delay injection, walk-in offline token generator, patient register, and analytics.

---

## 🏗️ Technology Stack

- **Frontend**: React.js (Vite), React Router v6, Axios, Lucide Icons
- **Backend**: Node.js, Express.js, CORS, Morgan
- **Database**: MongoDB Atlas Cloud with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt.js password hashing

---

## 📁 Project Directory Structure

```text
smart-queue-management/
│
├── client/                               # React Frontend (Vite)
│   ├── src/
│   │   ├── components/                   # Navbar, Footer, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # Hospital landing & live doctor availability
│   │   │   ├── Login.jsx                 # Auth with 1-click Demo credentials
│   │   │   ├── Register.jsx              # Patient registration
│   │   │   ├── LiveQueueTracker.jsx      # Public live queue tracking board
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.jsx  # Active token monitor & wait time
│   │   │   │   ├── BookToken.jsx         # Online token generator
│   │   │   │   ├── DoctorList.jsx        # Doctor directory with queue metrics
│   │   │   │   └── AppointmentHistory.jsx# Complete patient appointment log
│   │   │   └── admin/
│   │   │       ├── AdminDashboard.jsx    # Real-time KPIs & queue load
│   │   │       ├── QueueManagement.jsx   # Call next, complete, delay controls
│   │   │       ├── OfflineBooking.jsx    # Reception walk-in token generation
│   │   │       ├── DoctorManagement.jsx  # OPD doctor management
│   │   │       └── PatientList.jsx       # Searchable patient directory
│   │   ├── services/                     # Axios API endpoints
│   │   ├── context/                      # AuthContext session provider
│   │   ├── App.jsx                       # Master router
│   │   ├── index.css                     # Responsive healthcare styles
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                               # Node.js + Express.js API
│   ├── config/                           # MongoDB connection (db.js)
│   ├── controllers/                      # Auth, Doctor, Token, Queue, Patient controllers
│   ├── middleware/                       # JWT auth & role authorization guards
│   ├── models/                           # User, Doctor, Token, Consultation schemas
│   ├── routes/                           # Express route modules
│   ├── utils/
│   │   ├── queueCalculator.js            # Smart Queue Recalculation Algorithm
│   │   ├── generateToken.js              # JWT generator
│   │   ├── seedData.js                   # Initial database seeder
│   │   └── testAllBackend.js             # End-to-end automated test runner
│   ├── .env                              # Active configuration
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── package.json                          # Root scripts runner
├── README.md                             # Project documentation
└── VIVA_GUIDE.md                         # 16-question college viva defense guide
```

---

## 🔑 Demo Login Credentials

For quick evaluation or live project demonstration:

| Role | Email | Password | Pre-filled in Login Screen |
| :--- | :--- | :--- | :--- |
| **Hospital Admin** | `admin@hospital.com` | `adminpassword123` | ✅ Click "🛡️ Hospital Admin" |
| **Demo Patient** | `patient@example.com` | `patientpassword123` | ✅ Click "👤 Demo Patient" |

---

## 🚀 How to Run the Application

### 1. Start the Backend Server
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
# API Health: http://localhost:5000/api/health
```

### 2. Start the Frontend Client
In a separate terminal:
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🧠 Smart Queue Calculation Algorithm

When a doctor has an average consultation time of $T_{\text{avg}}$ minutes:

1. **Initial Estimation**:
   $$\text{Estimated Wait Time} = (N_{\text{ahead}} \times T_{\text{avg}}) + T_{\text{delay}}$$
2. **Dynamic Consultation Overrun Shift**:
   - If active patient's consultation takes longer than $T_{\text{avg}}$, the system calculates:
     $$\Delta_{\text{overrun}} = (\text{Current Time} - \text{Start Time}) - T_{\text{avg}}$$
   - All subsequent waiting tokens dynamically have their estimated start times pushed forward by $\Delta_{\text{overrun}}$.
3. **Cancellations / Missed Patients**:
   - When a patient is cancelled or marked `missed`, they are immediately removed from the upcoming waiting sequence, and downstream patients move up automatically.
4. **Doctor Late Arrival**:
   - Admin enters delay minutes (e.g., $+20$ mins). Baseline queue schedule shifts forward instantly for all waiting patients.

---

## 📄 Viva Preparation

Refer to [`VIVA_GUIDE.md`](./VIVA_GUIDE.md) for detailed answers to the 16 core questions asked during project viva and evaluation.
