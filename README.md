# Dwaar Backend

Backend infrastructure for **Dwaar**, a hyperlocal community platform that connects users based on geographic proximity and enables real-time group and private communication.

The backend combines **REST APIs, JWT authentication, Socket.IO, MongoDB, spatial search, Cloudinary, OpenAPI/Scalar documentation, automated testing, ESLint, GitHub Actions CI, and Render deployment**.

---

## Overview

Dwaar is designed around a simple idea:

> **People should be able to discover and communicate with communities around them.**

A user provides their location and selects a proximity range. The backend identifies nearby buildings/communities and allows users to join relevant rooms.

Once users are connected, Dwaar provides:

* User authentication
* Location-based discovery
* Community/group management
* Real-time group messaging
* Private messaging
* Typing indicators
* Online presence
* Persistent message history
* File and image uploads

---

## Architecture

```text
                         React Native Client
                                |
                 +--------------+--------------+
                 |                             |
              REST API                      Socket.IO
                 |                             |
                 v                             v
          +-------------+              +-------------+
          |   Express   |              |  Socket.IO  |
          |   Server    |              |   Server    |
          +-------------+              +-------------+
                 |                             |
       +---------+---------+           +-------+-------+
       |         |         |           |       |       |
       v         v         v           v       v       v
    Users     Groups    Spatial      Private  Group  Presence
    Routes    Routes    Search       Chat     Chat
       |         |         |           |       |       |
       +---------+---------+-----------+-------+-------+
                           |
                           v
                     +-----------+
                     |  MongoDB  |
                     +-----------+
                           |
                    +------+------+
                    |             |
                    v             v
                User Data     Messages

                           |
                           v
                      Cloudinary
                    File / Image Storage
```

---

# Key Features

### Authentication

* User registration and login
* JWT-based authentication
* Access token / refresh token flow
* Protected REST endpoints
* Password hashing using bcrypt

### Hyperlocal Discovery

* Location-based building discovery
* Configurable proximity ranges
* Preprocessed geographic building data
* Spatial tree based lookup
* Nearby room/community discovery

### Real-Time Communication

* Socket.IO based communication
* Private messaging
* Group messaging
* Typing indicators
* Online/offline presence
* Socket.IO room based group communication

### Persistence

* MongoDB Atlas
* Mongoose ODM
* Persistent users, groups and messages
* REST APIs for retrieving message history

### File Storage

* Multipart file uploads
* Cloudinary integration
* Cloud-based image/file storage

### Developer Infrastructure

* OpenAPI documentation
* Scalar API explorer
* Jest + Supertest
* ESLint
* GitHub Actions CI
* Render deployment
* Health-check endpoint

---

# Tech Stack

| Category           | Technology      |
| ------------------ | --------------- |
| Runtime            | Node.js         |
| Framework          | Express.js      |
| Database           | MongoDB         |
| ODM                | Mongoose        |
| Authentication     | JWT             |
| Password Hashing   | bcryptjs        |
| Real-Time          | Socket.IO       |
| File Storage       | Cloudinary      |
| Spatial Processing | Python          |
| API Specification  | OpenAPI 3.0     |
| API Documentation  | Scalar          |
| Testing            | Jest, Supertest |
| Code Quality       | ESLint          |
| CI                 | GitHub Actions  |
| Deployment         | Render          |

---

# Project Structure

```text
dwaar-backend/
│
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .gitignore
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
└── src/
    │
    ├── app.js
    │
    ├── config/
    │   ├── db.js
    │   └── openapi.js
    │
    ├── controllers/
    │   ├── user.controller.js
    │   ├── spatial.controller.js
    │   ├── geolocation.controller.js
    │   └── upload.controller.js
    │
    ├── middleware/
    │   ├── auth.js
    │   └── multer.js
    │
    ├── routes/
    │   ├── user.routes.js
    │   ├── spatial.routes.js
    │   └── upload.routes.js
    │
    ├── sockets/
    │   ├── index.js
    │   ├── chat.handler.js
    │   ├── private.handler.js
    │   ├── group.handler.js
    │   ├── message.routes.js
    │   ├── group.routes.js
    │   ├── conversations.routes.js
    │   ├── message.model.js
    │   └── group.model.js
    │
    └── __tests__/
        └── health.test.js
```

---

# Authentication

Dwaar uses JWT-based authentication for protected APIs.

```text
                     Login
                       |
                       v
              POST /api/users/login
                       |
                       v
                 JWT Token
                       |
                       v
          Authorization: Bearer <token>
                       |
                       v
              Authentication
                 Middleware
                       |
                       v
              Protected API
```

The authentication middleware validates the JWT before allowing access to protected resources.

### Example

```http
Authorization: Bearer <access_token>
```

For authenticated Socket.IO communication, the client can provide the token during connection setup.

```javascript
const socket = io(SERVER_URL, {
  auth: {
    token: accessToken
  }
});
```

> Socket authentication should only be documented as an implemented feature if the server currently verifies this token during the Socket.IO handshake.

---

# REST API

## Health Check

```http
GET /health
```

Returns the current server status and is also useful for deployment health monitoring.

---

## User APIs

Base URL:

```text
/api/users
```

| Method | Endpoint            | Description           | Auth |
| ------ | ------------------- | --------------------- | ---- |
| POST   | `/`                 | Create user           | Yes  |
| GET    | `/`                 | Get users             | Yes  |
| GET    | `/:id`              | Get user              | Yes  |
| PUT    | `/:id`              | Update user           | Yes  |
| DELETE | `/:id`              | Delete user           | Yes  |
| POST   | `/check-phone`      | Check phone number    | No   |
| POST   | `/login`            | Login                 | No   |
| POST   | `/logout`           | Logout                | Yes  |
| POST   | `/refresh-token`    | Refresh token         | No   |
| GET    | `/get-location`     | Get user location     | Yes  |
| POST   | `/add-location`     | Add/update location   | Yes  |
| POST   | `/nearby-buildings` | Find nearby buildings | Yes  |
| POST   | `/join-room`        | Join room             | Yes  |
| GET    | `/joined-rooms`     | Get joined rooms      | Yes  |

---

# Spatial Search

Base URL:

```text
/api/spatial
```

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| POST   | `/nearby`       | Find nearby buildings |
| POST   | `/nearby-rooms` | Find nearby rooms     |

The spatial system uses preprocessed geographic data instead of repeatedly scanning the entire building dataset.

```text
                    User Location
                          |
                          v
                   Spatial Query
                          |
                          v
                    Spatial Tree
                          |
                          v
                 Nearby Buildings
                          |
                          v
                 Nearby Communities
                          |
                          v
                      Rooms
```

This architecture allows the platform to perform proximity-based discovery using predefined geographic ranges such as:

```text
500 meters
1 kilometer
```

---

# Group APIs

Base URL:

```text
/api/groups
```

| Method | Endpoint                    | Description        |
| ------ | --------------------------- | ------------------ |
| POST   | `/`                         | Create group       |
| GET    | `/user/:userId`             | Get user's groups  |
| POST   | `/:groupId/members`         | Add member         |
| DELETE | `/:groupId/members/:userId` | Remove member      |
| GET    | `/:groupId/messages`        | Get group messages |
| POST   | `/:groupId/join`            | Join group         |

---

# Messaging APIs

## Group Message History

```http
GET /api/messages/rooms/:roomId
```

Retrieves previously stored messages for a room.

## Private Message History

```http
GET /api/messages/private/:toUserId
```

Retrieves the private conversation between users.

## Conversations

```http
GET /api/conversations/:userId
```

Retrieves conversations associated with a user.

---

# Real-Time Communication

Dwaar uses **Socket.IO** for real-time communication.

REST APIs are primarily used for request/response operations and historical data, while Socket.IO handles events that require low-latency communication.

```text
                    Messaging System
                           |
                +----------+----------+
                |                     |
             REST API             Socket.IO
                |                     |
                v                     v
          Message History       Live Messages
          Conversations        Typing Events
                               Presence
```

---

# Presence System

The Socket.IO layer maintains information about active users and their connections.

### Register User

```text
register_user
```

Registers the user's active socket connection.

Conceptually:

```text
userId -> socketId
```

### Online Users

```text
online_users
```

Provides the currently connected users.

### User Offline

```text
user_offline
```

Emitted when a user's socket disconnects.

---

# Private Messaging

### Client → Server

```text
send_private_message
```

### Server → Client

```text
receive_private_message
```

### Typing Indicator

```text
private_typing
```

### Error

```text
private_message_error
```

Message flow:

```text
User A
   |
   | send_private_message
   v
Socket.IO Server
   |
   +------------------> MongoDB
   |
   +------------------> User B
                              |
                              v
                     receive_private_message
```

Messages are persisted in MongoDB so that message history can be retrieved later through REST APIs.

---

# Group Messaging

Socket.IO rooms are used to isolate communication between groups.

Conceptually:

```text
group:<groupId>
```

### Events

| Event                   | Direction       | Purpose            |
| ----------------------- | --------------- | ------------------ |
| `join_group`            | Client → Server | Join group room    |
| `join_groups`           | Client → Server | Join user's groups |
| `leave_group`           | Client → Server | Leave group        |
| `send_group_message`    | Client → Server | Send message       |
| `receive_group_message` | Server → Client | Receive message    |
| `group_typing`          | Bidirectional   | Typing indicator   |

Message flow:

```text
User
  |
  | send_group_message
  v
Socket.IO Server
  |
  v
group:<groupId>
  |
  +------> User A
  +------> User B
  +------> User C
```

---

# Hybrid REST + WebSocket Architecture

Dwaar deliberately uses both REST and WebSockets.

### REST

Used for:

```text
Authentication
User management
Group management
Spatial discovery
File uploads
Message history
Conversation history
```

### Socket.IO

Used for:

```text
Private messaging
Group messaging
Typing indicators
Online presence
```

This separation prevents the application from using continuous polling for real-time events while retaining the simplicity of REST for standard CRUD and historical operations.

---

# File Uploads

```http
POST /api/upload
```

The endpoint accepts:

```text
multipart/form-data
```

with:

```text
file
```

The backend processes the uploaded file and stores it using Cloudinary.

```text
React Native
     |
     | multipart/form-data
     v
Express Upload Route
     |
     v
Multer
     |
     v
Cloudinary
     |
     v
Stored File URL
```

---

# API Documentation

The backend exposes an OpenAPI specification and uses **Scalar** to provide interactive API documentation.

Once the server is running:

```text
http://localhost:5000/docs
```

Production:

```text
https://dwaar-backend.onrender.com/docs
```

The OpenAPI configuration is maintained in:

```text
src/config/openapi.js
```

---

# Environment Variables

Create a `.env` file in the project root:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CLIENT_URL=http://localhost:3000
```

Never commit secrets to source control.

Recommended `.gitignore` entries:

```text
.env
node_modules/
```

---

# Running Locally

## 1. Clone

```bash
git clone https://github.com/avserver-16/dwaar-backend.git

cd dwaar-backend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create `.env` and provide the required values.

## 4. Start development server

```bash
npm run dev
```

The server will be available at:

```text
http://localhost:5000
```

---

# Production

Start the application with:

```bash
npm start
```

The application uses the deployment-provided `PORT`:

```javascript
const PORT = process.env.PORT || 5000;
```

This allows the same application to run locally and on Render.

---

# Testing

Dwaar uses **Jest** and **Supertest** for automated testing.

Run tests:

```bash
npm test
```

Example:

```text
PASS src/__tests__/health.test.js

Health Check
  ✓ GET /health should return 200
```

Testing is integrated into the CI pipeline so that regressions can be detected automatically.

---

# Linting

Run ESLint:

```bash
npm run lint
```

Automatically fix supported issues:

```bash
npm run lint -- --fix
```

---

# Continuous Integration

GitHub Actions runs automated checks whenever changes are pushed or pull requests are created.

```text
                  Git Push / Pull Request
                           |
                           v
                    Checkout Repository
                           |
                           v
                     Setup Node.js
                           |
                           v
                  Install Dependencies
                           |
                           v
                        ESLint
                           |
                           v
                       Jest Tests
                           |
                     +-----+-----+
                     |           |
                   PASS         FAIL
                     |           |
                     v           v
                   Merge       Fix Code
```

Workflow configuration:

```text
.github/workflows/ci.yml
```

The CI pipeline helps ensure that code passes automated quality checks before deployment.

---

# Deployment

The backend is deployed using **Render**.

### Production

```text
https://dwaar-backend.onrender.com
```

### Health Check

```text
https://dwaar-backend.onrender.com/health
```

### API Documentation

```text
https://dwaar-backend.onrender.com/docs
```

Production environment variables should be configured through the Render dashboard rather than committed to the repository.

---

# Security Considerations

The backend currently uses:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Environment-based secret management
* CORS configuration
* Server-side authorization checks where implemented

### Important

Authentication and authorization should always be derived from the verified server-side identity.

Client-provided values such as:

```text
senderId
userId
x-user-id
```

should not be treated as proof of identity.

Additional hardening that can be introduced includes:

* Socket.IO JWT handshake authentication
* Rate limiting
* Request schema validation
* Strict production CORS
* Authorization middleware for all group operations
* Message ownership validation
* Protection against client-controlled sender identities

---

# Design Decisions

## Why REST + Socket.IO?

REST provides a clean interface for CRUD operations and historical data.

Socket.IO provides low-latency communication for events that need to happen immediately.

This gives Dwaar a hybrid communication architecture:

```text
             Client
                |
       +--------+--------+
       |                 |
      REST           Socket.IO
       |                 |
       v                 v
 CRUD / History      Real-time
                     Events
```

---

## Why MongoDB?

MongoDB provides a flexible document model suitable for Dwaar's evolving data structures.

Primary persisted entities include:

```text
Users
Groups
Messages
Locations
Conversations
```

Mongoose provides schema modeling, validation, and database interaction from Node.js.

---

## Why Spatial Preprocessing?

The building dataset can contain a large number of geographic records.

Instead of scanning the entire dataset for every request, Dwaar preprocesses geographic information and uses a spatial tree to narrow the search.

```text
Large Geographic Dataset
          |
          v
    Preprocessing
          |
          v
     Spatial Tree
          |
          v
    Fast Lookup
          |
          v
 Nearby Buildings
```

---

# Current Backend Capabilities

```text
                         Dwaar Backend
                              |
       +----------+-----------+-----------+----------+
       |          |           |           |          |
       v          v           v           v          v
   Auth       Spatial      Groups     Messaging    Uploads
       |          |           |           |          |
       v          v           v           v          v
     JWT      Location      Rooms     Socket.IO   Cloudinary
                              |
                              v
                           MongoDB
                              |
                              v
                        Persistent Data
```

---

# Future Improvements

The following are potential extensions rather than current guarantees:

### Scalability

* Redis-backed Socket.IO adapter
* Horizontal scaling
* Load balancing
* Redis caching
* Connection/session management across multiple server instances

### Messaging

* Message pagination
* Read receipts
* Delivery receipts
* Push notifications for offline users
* Message search
* Message attachments

### Security

* Rate limiting
* Request schema validation using Zod/Joi
* More granular authorization
* Stronger Socket.IO authentication
* End-to-end encryption for private conversations

### Infrastructure

* Docker containerization
* Production observability
* Structured logging
* Metrics
* Distributed tracing
* Automated deployment pipelines

### Testing

* WebSocket integration tests
* Authentication tests
* Group authorization tests
* Message persistence tests
* Spatial search tests
* End-to-end API tests

---

# Backend Engineering Highlights

This project demonstrates practical backend engineering concepts including:

```text
REST API Design
       |
       +---- JWT Authentication
       |
       +---- Middleware
       |
       +---- MongoDB / Mongoose
       |
       +---- WebSocket Communication
       |
       +---- Socket.IO Rooms
       |
       +---- Spatial Search
       |
       +---- Cloud File Storage
       |
       +---- OpenAPI Documentation
       |
       +---- Automated Testing
       |
       +---- Static Analysis
       |
       +---- CI/CD
       |
       +---- Cloud Deployment
```

---

# Author

**Avish Vijay Shetty**

Computer Engineering
D. J. Sanghvi College of Engineering

**GitHub:**
https://github.com/avserver-16

**Project Repository:**
https://github.com/avserver-16/dwaar-backend

---

## License

This project is developed as part of a software engineering project and is currently maintained by the author.
