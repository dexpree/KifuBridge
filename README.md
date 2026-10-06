# KifuBridge – Donation Management System

## 📌 About the Project

**KifuBridge** is a MERN Stack-based Donation Management System designed to connect donors with people and organizations in need. The platform helps manage donations, donation requests, fundraising campaigns, and delivery activities through a centralized web application.

The main objective of KifuBridge is to make the donation process more organized, transparent, accessible, and efficient by providing digital tools for donors, users, and administrators.

## 🎯 Objectives

- To provide an online platform for managing donations.
- To connect donors with people and organizations in need.
- To simplify donation creation, tracking, and management.
- To manage donation requests and fundraising campaigns.
- To provide secure user authentication and role-based access.
- To improve transparency through notifications and audit logs.
- To support digital payment integration.

## ✨ Features

### 👤 User Management
- User registration and login.
- Authentication using JSON Web Tokens (JWT).
- Password hashing for improved security.
- User profile management.
- Role-based access control.

### 🎁 Donation Management
- Create and manage donations.
- Provide donation item details, categories, descriptions, and quantities.
- Track donation information.
- View and manage donation records.

### 📋 Donation Requests
- Create and manage requests for donations.
- Maintain request information and status.
- Support coordination between donors and recipients.

### 📢 Fundraising Campaigns
- Manage fundraising campaigns.
- Store campaign details and related information.
- Support campaign-based donation activities.

### 💳 Payment Management
- Payment-related functionality using Razorpay.
- Maintain payment records.
- Support donation payment processing according to the configured payment mode.

### 🔔 Notifications
- Notification management for platform activities.
- Keep users informed about relevant updates.

### 🛡️ Administration
- Administrative management of users and donations.
- Manage donation requests and campaigns.
- View administrative information and records.
- Maintain audit logs for tracking system activities.

### 📝 Complaints Management
- Manage complaints submitted through the platform.
- Maintain complaint records for administrative review.

## 🛠️ Technologies Used

**Frontend**
- React.js
- Vite
- JavaScript
- React Router
- Axios
- Bootstrap
- CSS

**Backend**
- Node.js
- Express.js

**Database**
- MongoDB
- Mongoose

**Authentication and Security**
- JSON Web Tokens (JWT)
- bcryptjs
- dotenv

**Payment Integration**
- Razorpay

**Development Tools**
- Visual Studio Code
- MongoDB Compass
- Postman
- Git and GitHub

## 📂 Project Structure

```text
KifuBridge/
│
├── Backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── Frontend/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB database
- Visual Studio Code or another code editor
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/dexpree/KifuBridge.git
```

Navigate to the project directory:

```bash
cd KifuBridge
```

### 2. Configure the Backend

Open a terminal in the backend directory:

```bash
cd Backend
```

Install the dependencies:

```bash
npm install
```

Create a `.env` file inside the `Backend` directory and configure the required environment variables.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
```

Configure any additional environment variables required by your payment or notification implementation. Never commit actual credentials to GitHub.

### 3. Start the Backend Server

For development:

```bash
npm run dev
```

To start the server normally:

```bash
npm start
```

The backend runs on port `5000` by default, unless another port is configured.

Backend URL:

```text
http://localhost:5000
```

### 4. Configure the Frontend

Open a new terminal in the project root:

```bash
cd Frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will display the local URL in your terminal. Open that URL in your web browser to access the application.

## 🔐 Security Notes

- Store database credentials and secret keys in environment variables.
- Never upload `.env` files containing real credentials.
- Do not expose payment secrets in frontend code.
- Use appropriate authentication and authorization checks for protected operations.
- Use test credentials when testing payment functionality.

## 🚀 Future Enhancements

- Mobile application for Android and iOS.
- Real-time notifications and status updates.
- Improved donation tracking and delivery coordination.
- Advanced analytics and reporting dashboards.
- Location-based donation matching.
- Enhanced payment verification and transaction reports.
- Additional accessibility and security improvements.

## 🎓 Project Information

**Project Name:** KifuBridge – Donation Management System

**Project Type:** Web Application

**Project Domain:** Social Welfare and Donation Management

**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

## 👨‍💻 Author

**Preetham**

GitHub: https://github.com/dexpree

## 📄 License

This project is intended for academic and educational purposes. Add a specific open-source license if you intend to permit public reuse or distribution.
