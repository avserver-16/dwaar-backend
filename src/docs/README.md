# Dwaar Backend

Backend system for authentication, session management, and real-time user location handling.

Built with:

* [Node.js](https://nodejs.org?utm_source=chatgpt.com)
* [Express.js](https://expressjs.com?utm_source=chatgpt.com)
* [MongoDB](https://www.mongodb.com?utm_source=chatgpt.com)
* [JWT Authentication](https://jwt.io?utm_source=chatgpt.com)

---

# Features

* User Registration & Login
* JWT-based Authentication
* Refresh Token Support
* Protected Routes using Middleware
* Session Persistence
* User Location Tracking
* Reverse Geocoding Integration
* Fetch & Update User Location
* Secure API Authorization

---

# Authentication Flow

```txt id="rdb4mn"
Login
  ↓
JWT Token Generated
  ↓
Token Stored in App
  ↓
Protected API Access
```

---

# Location Flow

```txt id="qknk4v"
App Launch
   ↓
Location Permission
   ↓
Get GPS Coordinates
   ↓
Reverse Geocoding
   ↓
Send Location to Backend
   ↓
Store in MongoDB
```

---

# Main Endpoints

| Method | Endpoint               | Description          |
| ------ | ---------------------- | -------------------- |
| POST   | `/users/login`         | Login user           |
| POST   | `/users/refresh-token` | Refresh JWT token    |
| POST   | `/users/add-location`  | Update user location |
| GET    | `/users/get-location`  | Fetch user location  |
| GET    | `/users/:id`           | Fetch user by ID     |

---

# Security

* JWT Middleware Verification
* Protected Routes
* Token-based Authorization
* Request Validation

---

# Tech Stack

| Layer    | Technology          |
| -------- | ------------------- |
| Backend  | Express.js          |
| Database | MongoDB             |
| Auth     | JWT                 |
| Mobile   | React Native + Expo |
| Location | Expo Location       |

---

# Current Status

 Authentication System
 JWT Middleware
 Refresh Token Flow
 User Location Tracking
Protected APIs
 MongoDB Integration
 Session Persistence
