# 🛒 E-Commerce Backend (Node.js + Express + MongoDB + Socket.io + BullMQ)

A production-ready backend for an e-commerce platform with **order management, payment flow, refund system, real-time tracking, and admin dashboard APIs**.

---

# 🚀 Features

## 👤 User Features

* User authentication (JWT)
* Add to cart & manage cart
* Place order
* Cancel order
* Payment (COD + Dummy Online)
* Order tracking (real-time)

## 🛠️ Admin Features

* Approve / Reject orders
* Update order status (confirmed, shipped, delivered)
* View all orders
* Dashboard analytics (sales, revenue)
* Real-time notifications

## 💰 Payment & Refund

* Payment system (COD + dummy online payment)
* Refund processing system
* Async refund handling using **BullMQ + Redis**

## 🔔 Real-Time System

* Socket.io integration
* Live order tracking
* Real-time notifications

---

# 🧱 Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Queue System:** BullMQ
* **Cache / Queue DB:** Redis
* **Real-time:** Socket.io
* **Auth:** JWT
* **Email:** Nodemailer

---

# 📂 Project Structure

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── services/
 ├── workers/
 ├── utils/
 ├── config/
 ├── middlewares/
```

---

# 🔄 Complete Flow

## 🛒 Order Flow

```
User → Add to cart → Create Order → Payment → Admin Approval → Shipment → Delivery
```

---

## 💳 Payment Flow

```
Create Order
   ↓
Select Payment Method
   ↓
COD → Complete
Online → Dummy Payment Success
   ↓
paymentStatus = paid
```

---

## ❌ Cancel + Refund Flow

```
User cancels order
   ↓
Order status → cancelled
   ↓
If payment = paid
   ↓
Refund added to Queue (BullMQ)
   ↓
Worker processes refund
   ↓
refundStatus = completed
   ↓
Email sent to user
```

---

## 🔔 Real-Time Flow

```
Admin updates order status
   ↓
Socket emit event
   ↓
User receives live update
```

---

# 📡 API Routes

## 👤 User APIs

```
POST   /api/user/register
POST   /api/user/login
```

---

## 🛒 Order APIs

```
POST   /api/orders/create
POST   /api/orders/cancel
GET    /api/orders/:id
```

---

## 💳 Payment APIs

```
POST   /api/payment/pay
```

---

## 🛠️ Admin APIs

```
GET    /api/admin/dashboard
GET    /api/admin/orders
GET    /api/admin/sales/daily
GET    /api/admin/sales/weekly
GET    /api/admin/sales/monthly
PUT   /api/admin/approve
PUT   /api/admin/reject
```

---


---

# ⚙️ Setup Instructions

## 1️⃣ Clone Repository

```bash
git clone <repo-url>
cd backend
```

---

## 2️⃣ Install Dependencies

```bash
npm install
```

---

## 3️⃣ Environment Variables

Create `.env` file:

```
PORT=5000
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret

EMAIL_USER=your_email
EMAIL_PASS=your_password

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 4️⃣ Start Redis

```bash
redis-server
```

---

## 5️⃣ Run Server

```bash
npm run dev
```

---

## 6️⃣ Run Worker (Refund Queue)

```bash
node src/workers/refundWorker.js
```

---

# 🧪 Testing

* Use **Postman** for API testing
* Use **HTML / React frontend** for socket testing

---

# 📊 Admin Dashboard Data

* Total Orders
* Total Revenue
* Monthly Sales Graph
* Pending Orders
* Cancelled Orders

---

# 🔥 Future Improvements

* Razorpay / Stripe integration
* Webhook support
* Push notifications
* Role-based access control
* Docker deployment

---

# 💪 Conclusion

This backend includes:

```
✔ Full E-commerce Flow
✔ Real-time updates
✔ Async refund system
✔ Admin dashboard APIs
✔ Clean architecture (services layer)
```

---

# 👨‍💻 Author

Kapil Banshiwal

---
