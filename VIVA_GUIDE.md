# Viva & Project Defense Guide
## Smart Queue Management System for Hospital Management
**Design Thinking & Engineering (DT&E) Academic Project • 2nd Year CSE**

---

### 1. What problem does the project solve?
In conventional hospital OPDs, patients take physical or static appointment tokens scheduled for specific times. However, healthcare consultation times are naturally unpredictable:
- A doctor may arrive 30 minutes late due to emergencies or traffic.
- A complicated patient case scheduled for 10 minutes might take 25 minutes.
- As a result, the entire queue experiences a cascading delay. Patients wait in crowded, stressful waiting rooms with zero visibility into their real arrival or consultation time.
- **Solution:** Our system implements dynamic wait-time recalculation, providing patients and receptionists with transparent, real-time queue intelligence.

---

### 2. Why is a smart queue required?
A static queue only knows sequential token numbers. A **Smart Queue**:
1. Monitors doctor availability and delays.
2. Tracks active consultation elapsed time.
3. Dynamically shifts estimated wait times for all downstream patients whenever delays, cancellations, or patient absences occur.
4. Reduces hospital lobby crowding and patient frustration.

---

### 3. How does online token booking work?
1. The patient registers/logs into the portal.
2. They select a doctor from the OPD directory and view the doctor's real-time queue status (current waiting count, average consultation speed).
3. The patient clicks **Book Token**.
4. The backend generates a sequential token number (e.g., `A001`, `A002`) and sets `tokenType = 'online'`.
5. The queue calculator assigns their queue position and calculates estimated start time based on current queue load.
6. The patient can monitor their position live from their personal dashboard.

---

### 4. How does offline token booking work?
Recognizing that elderly or walk-in patients may not use smartphones:
1. Hospital receptionists/admins use the **Offline Walk-In Registration** module.
2. The receptionist enters the patient's name, phone number, and selects the consulting doctor.
3. The system assigns the next sequential token with `tokenType = 'offline'`.
4. **Key Architecture Rule:** Both online and offline tokens enter the **exact same single queue** in strict chronological sequence.
5. The system prints/generates a token slip with their token number, room number, and estimated waiting time.

---

### 5. How does the admin manage the queue?
The Administrator/Doctor has access to the **Queue Management Console**:
- **Call Next Patient:** Automatically summons the first waiting token in line, transitions their status to `in_consultation`, updates the doctor's status to `In Consultation`, and starts the consultation timer.
- **Complete Consultation:** Records the actual consultation duration, updates the consultation log, sets doctor status back to `Available`, and triggers queue recalculation.
- **Mark Patient Missed:** If a patient is absent when called, the admin marks them as `missed`. The patient is removed from upcoming wait calculations and the next patient moves up immediately.
- **Update Doctor Delay:** If the doctor is delayed, the admin can inject delay minutes (e.g., +15 mins), instantly adjusting all subsequent patient wait times.

---

### 6. How does automatic queue updating work?
Whenever any state change occurs (new token booked, consultation starts/completes, doctor delay injected, token cancelled, patient missed), the server invokes `recalculateDoctorQueue(doctorId)`.
1. It queries all tokens for that doctor today ordered by `sequenceNumber`.
2. It assesses the active consultation's elapsed duration.
3. It determines the starting baseline time for the next consultation:
   $$\text{Baseline Time} = \text{Now} + \text{Remaining Active Time} + \text{Doctor Delay}$$
4. It iterates through all waiting tokens, setting each patient's `queuePosition`, `estimatedWaitMinutes`, and `estimatedStartTime`.
5. The client dashboards poll this updated state, keeping patients updated in real time.

---

### 7. How is waiting time calculated?
Initially, for a waiting patient with $N$ patients ahead:
$$\text{Estimated Wait Time} = (N \times \text{Average Consultation Duration}) + \text{Doctor Delay}$$

When a consultation is currently active:
- $\text{Elapsed Time} = \text{Current Time} - \text{Consultation Start Time}$
- If $\text{Elapsed Time} < \text{Average Duration}$, $\text{Remaining Time} = \text{Average Duration} - \text{Elapsed Time}$.
- If $\text{Elapsed Time} \ge \text{Average Duration}$, the consultation has overrun. An overrun buffer is applied.
- For the $i$-th waiting patient in line:
  $$\text{Wait Time}_i = \text{Remaining Active Time} + (i - 1) \times \text{Average Duration} + \text{Doctor Delay}$$

---

### 8. What happens when a doctor is delayed?
1. The admin marks the doctor as `Delayed` and enters the expected delay (e.g., 20 minutes).
2. The queue engine immediately adds 20 minutes to the baseline time.
3. Every waiting patient's estimated start time shifts forward by 20 minutes.
4. Patients see an alert banner on their dashboard: *"Doctor Schedule Delayed: +20 mins (Traffic congestion)"*.

---

### 9. What happens when a consultation takes longer than expected?
- If Token 1 is scheduled for 10 minutes but takes 25 minutes, the active consultation timer records an overrun of 15 minutes.
- The smart queue detects this elapsed time and pushes Tokens 2, 3, and 4 forward by the overrun difference.
- Patients are not left wondering why their appointment has not started; their dashboard displays an updated estimated consultation time.

---

### 10. Why was the chosen technology stack used?
- **Frontend (React.js + Vite):** Fast, component-driven UI enabling responsive dashboards for both mobile patients and desktop hospital administrators.
- **Backend (Node.js + Express.js):** Asynchronous, event-driven I/O model well suited for handling concurrent queue requests and dynamic computations.
- **Database (MongoDB + Mongoose):** Flexible document schema that represents appointments, consultation duration metrics, and nested doctor status seamlessly.
- **JWT & bcryptjs:** Industry-standard stateless security without session overhead.

---

### 11. How does authentication work?
1. User submits email and password.
2. Backend queries MongoDB (`select: false` protects the hashed password).
3. `bcrypt.compare()` verifies the entered password against the salt-hashed password.
4. Backend issues a signed JSON Web Token (JWT) containing the user ID and role (`patient` or `admin`).
5. Frontend stores the token in `localStorage` and attaches it via an Axios Request Interceptor: `Authorization: Bearer <token>`.
6. Express middleware `protect` and `authorize('admin')` guard restricted endpoints.

---

### 12. How is patient data stored?
- In MongoDB Atlas across structured collections:
  - `users`: Credentials, phone, role.
  - `doctors`: Specialty, room number, average consultation speed, delay status.
  - `tokens`: Unified queue records (patient name, phone, doctor ID, sequence number, `online`/`offline` type, wait minutes, status).
  - `consultations`: Timers, actual vs expected duration, delay difference, doctor notes.

---

### 13. How does the frontend communicate with the backend?
Through a modular RESTful Axios API client (`src/services/api.js`). Responses are handled via JSON payloads. An active polling interval (10-15s) keeps live queue views synchronized.

---

### 14. What are the main APIs?
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new patient | Public |
| `POST` | `/api/auth/login` | Login and receive JWT | Public |
| `GET` | `/api/doctors` | List doctors & live queue summaries | Public |
| `POST` | `/api/tokens/book-online` | Book online token | Patient |
| `POST` | `/api/tokens/book-offline` | Book walk-in token | Admin |
| `GET` | `/api/tokens/my-tokens` | Patient active & past tokens | Patient |
| `GET` | `/api/queue/doctor/:doctorId` | Full chronological queue | Public/Admin |
| `POST` | `/api/queue/call-next` | Call next token in queue | Admin |
| `POST` | `/api/queue/complete-consultation` | Complete consultation | Admin |
| `PUT` | `/api/doctors/:id/status` | Update doctor delay & status | Admin |
| `GET` | `/api/queue/admin/stats` | Aggregate dashboard KPIs | Admin |

---

### 15. What are the limitations of the current system?
- Uses client-side polling rather than persistent WebSockets for live updates.
- Doctor consultation times are based on historical averages rather than disease severity categorization.

---

### 16. What future improvements could be added?
1. **SMS / WhatsApp Notifications:** Sending SMS alerts when a patient is next in line ("Your turn is in 10 minutes, please proceed to Room 102").
2. **Emergency Triage Priority:** Adding priority flags for acute or emergency cases while smoothly re-sequencing non-emergency tokens.
3. **Multi-Department Referral Queues:** Seamlessly transferring a patient's token to Radiology or Laboratory after the initial doctor visit.
4. **QR Code Verification:** Enabling patients to scan a QR code at the hospital entrance to confirm their arrival.
