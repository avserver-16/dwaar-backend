Absolutely. Since this is now a backend project with **JWT authentication, REST APIs, Socket.IO real-time communication, MongoDB, spatial search, Cloudinary uploads, Scalar API documentation, Jest tests, ESLint, GitHub Actions CI, and Render deployment**, the README should present it like a serious backend project rather than just listing endpoints.

You can use this directly as your `README.md`:

````markdown
# Dwaar Backend

Backend service for **Dwaar**, a pseudonymous hyperlocal community platform that connects users based on their geographic proximity and enables real-time community, group, and private communication.

The backend provides REST APIs for authentication, users, groups, spatial discovery, file uploads, and message history, while **Socket.IO** handles real-time messaging, typing indicators, group communication, and online presence.

---

## Features

- JWT-based authentication and authorization
- User registration and login
- Access token and refresh token flow
- Protected REST APIs
- Hyperlocal building and room discovery
- Spatial proximity search using preprocessed geospatial data
- Community/group management
- Private one-to-one messaging
- Real-time group messaging using Socket.IO
- Real-time typing indicators
- Online/offline user presence
- Persistent message storage using MongoDB
- Image/file uploads using Cloudinary
- REST API documentation using Scalar
- Health-check endpoint for deployment monitoring
- Automated linting and testing with GitHub Actions
- Deployment on Render

---

# Architecture

```text
                         React Native Client
                                |
                    +-----------+-----------+
                    |                       |
                 REST API                Socket.IO
                    |                       |
                    v                       v
              +-----------+          +-------------+
              |  Express  |          | Socket.IO   |
              |   Server  |          |   Server    |
              +-----------+          +-------------+
                    |                       |
        +-----------+-----------+           |
        |           |           |           |
        v           v           v           v
      Users      Groups      Spatial      Real-time
      Routes     Routes      Routes       Handlers
        |           |           |           |
        +-----------+-----------+-----------+
                    |
                    v
               +----------+
               | MongoDB  |
               +----------+
                    |
              +-----+------+
              |            |
              v            v
         User Data     Messages

              |
              v
          Cloudinary
        File / Image Storage
````

---

# Tech Stack

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.IO

### Authentication

* JSON Web Tokens (JWT)
* bcryptjs

### Spatial Processing

* Python
* Preprocessed spatial tree
* Geospatial building dataset

### Storage

* MongoDB Atlas
* Cloudinary

### API Documentation

* OpenAPI 3.0
* Scalar

### Testing & Code Quality

* Jest
* Supertest
* ESLint
* GitHub Actions

### Deployment

* Render

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

Dwaar uses JWT-based authentication.

```text
Login
  |
  v
POST /api/users/login
  |
  v
JWT Access Token
  |
  v
Authorization: Bearer <token>
  |
  v
Protected API
```

Protected routes validate the JWT using authentication middleware before processing the request.

For Socket.IO connections, the token can also be supplied during the socket handshake:

```javascript
const socket = io(SERVER_URL, {
  auth: {
    token: accessToken
  }
});
```

The server verifies the token and associates the authenticated user with the socket connection.

---

# REST API

## Health Check

```http
GET /health
```

Returns server status and uptime.

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
| POST   | `/join-room`        | Join a room           | Yes  |
| GET    | `/joined-rooms`     | Get joined rooms      | Yes  |

---

# Spatial APIs

Base URL:

```text
/api/spatial
```

| Method | Endpoint        | Description           |
| ------ | --------------- | --------------------- |
| POST   | `/nearby`       | Find nearby buildings |
| POST   | `/nearby-rooms` | Find nearby rooms     |

Spatial data is preprocessed and indexed to support efficient proximity-based queries.

---

# Group APIs

Base URL:

```text
/api/groups
```

| Method | Endpoint                    | Description         |
| ------ | --------------------------- | ------------------- |
| POST   | `/`                         | Create group        |
| GET    | `/user/:userId`             | Get groups for user |
| POST   | `/:groupId/members`         | Add member          |
| DELETE | `/:groupId/members/:userId` | Remove member       |
| GET    | `/:groupId/messages`        | Get group messages  |
| POST   | `/:groupId/join`            | Join group          |

---

# Message APIs

## Room Messages

```http
GET /api/messages/rooms/:roomId
```

Retrieves previously stored messages from a room.

## Private Messages

```http
GET /api/messages/private/:toUserId
```

Retrieves the conversation history between the authenticated user and another user.

---

# Conversation API

```http
GET /api/conversations/:userId
```

Returns conversations associated with a user.

---

# File Upload

```http
POST /api/upload
```

Accepts:

```text
multipart/form-data
```

with:

```text
file
```

The uploaded file is processed and stored using Cloudinary.

---

# Real-Time Communication

Dwaar uses **Socket.IO** for real-time communication instead of repeatedly polling REST endpoints.

## Connection

```text
React Native
     |
     | Socket.IO connection
     v
Node.js Socket.IO Server
```

---

## Presence

### Register user

```text
register_user
```

Tracks the user's active socket connection.

The server maintains:

```text
userId -> socketId
```

### Online users

```text
online_users
```

Returns currently connected users.

### User offline

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

### Typing indicator

```text
private_typing
```

### Error

```text
private_message_error
```

Private messages are:

1. Received through Socket.IO
2. Persisted in MongoDB
3. Delivered to the recipient's active socket

```text
User A
   |
   | send_private_message
   v
Socket.IO Server
   |
   +----> MongoDB
   |
   +----> User B
             |
             v
      receive_private_message
```

If the recipient is offline, the message remains persisted in MongoDB and can be retrieved later through the REST API.

---

# Group Messaging

### Join group

```text
join_group
```

### Join all user's groups

```text
join_groups
```

### Leave group

```text
leave_group
```

### Send message

```text
send_group_message
```

### Receive message

```text
receive_group_message
```

### Typing indicator

```text
group_typing
```

Group users are assigned to Socket.IO rooms:

```text
group:<groupId>
```

Messages are broadcast to the corresponding group room.

---

# Message Architecture

Dwaar uses a hybrid REST + WebSocket architecture.

```text
                    Messaging
                       |
             +---------+---------+
             |                   |
          History             Real-time
             |                   |
            REST              Socket.IO
             |                   |
             v                   v
          MongoDB            Connected Users
```

REST APIs are used to retrieve historical data, while Socket.IO handles live communication.

This avoids repeatedly polling the backend for new messages.

---

# Spatial Discovery

Dwaar is designed around proximity-first communities.

The platform processes geographic building data and indexes it using a spatial tree.

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
Community / Room
```

The system supports configurable proximity zones such as:

```text
500 meters
1 kilometer
```

This allows users to discover communities based on physical proximity.

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

Never commit `.env` to GitHub.

Add:

```text
.env
node_modules/
```

to `.gitignore`.

---

# Local Development

## 1. Clone the repository

```bash
git clone https://github.com/avserver-16/dwaar-backend.git
cd dwaar-backend
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create:

```text
.env
```

and add the required environment variables.

## 4. Start development server

```bash
npm run dev
```

The server runs on:

```text
http://localhost:5000
```

---

# Production

Start the server using:

```bash
npm start
```

The application reads the deployment-provided `PORT` environment variable:

```javascript
const PORT = process.env.PORT || 5000;
```

This allows the same application to run locally and on platforms such as Render.

---

# API Documentation

Dwaar exposes interactive API documentation using **Scalar**.

Once the server is running, open:

```text
/docs
```

Local:

```text
http://localhost:5000/docs
```

Production:

```text
https://dwaar-backend.onrender.com/docs
```

The documentation is generated from the OpenAPI specification in:

```text
src/config/openapi.js
```

---

# Testing

The project uses Jest for automated testing.

Run all tests:

```bash
npm test
```

Example:

```text
PASS src/__tests__/health.test.js

Health Check
  ✓ GET /health should return 200
```

Tests are intentionally separated from production infrastructure such as MongoDB and Socket.IO so that unit/API tests can run independently.

---

# Linting

Run ESLint:

```bash
npm run lint
```

Automatically fix supported lint issues:

```bash
npm run lint -- --fix
```

---

# CI Pipeline

GitHub Actions automatically runs checks for pushes and pull requests to `main`.

```text
                GitHub PR
                    |
                    v
             Checkout Code
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
                    v
                  PASS
                    |
                    v
                 MERGE
                    |
                    v
                Render
                    |
                    v
              Production
```

Workflow:

```text
.github/workflows/ci.yml
```

The CI pipeline ensures that code is linted and tested before changes are merged.

---

# Deployment

The backend is deployed on Render.

Production server:

```text
https://dwaar-backend.onrender.com
```

Health check:

```text
https://dwaar-backend.onrender.com/health
```

API documentation:

```text
https://dwaar-backend.onrender.com/docs
```

Render environment variables should contain the production values for:

```text
PORT
MONGO_URI
JWT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLIENT_URL
```

---

# Security

The backend implements several security mechanisms:

* JWT authentication
* Protected REST endpoints
* Socket.IO authentication
* Server-side user identification
* Group membership verification
* Password hashing with bcrypt
* Environment-based secret management
* CORS configuration
* Request validation
* Authentication for private message history
* Server-side authorization checks

Client-provided user IDs should not be trusted for authentication or authorization. The authenticated identity should be derived from the verified JWT.

---

# Design Decisions

### REST + Socket.IO

REST is used for operations where request/response semantics are appropriate:

```text
Authentication
User management
Group management
Spatial queries
File uploads
Message history
```

Socket.IO is used for latency-sensitive operations:

```text
Private messaging
Group messaging
Typing indicators
Online presence
```

### MongoDB

MongoDB provides persistent storage for:

```text
Users
Groups
Messages
Locations
Conversations
```

### Spatial Indexing

Instead of repeatedly scanning a large building dataset, spatial data is preprocessed and indexed to support efficient proximity lookups.

---

# Future Improvements

Potential improvements include:

* Redis-backed Socket.IO adapter for horizontal scaling
* Multiple active sockets per user
* Message delivery/read receipts
* Push notifications for offline users
* Message pagination
* Redis caching
* Rate limiting
* Request schema validation using Zod/Joi
* Role-based group authorization
* Advanced geospatial indexing
* End-to-end encryption for private conversations
* Automated integration and WebSocket tests
* Docker-based deployment
* Observability with structured logging and metrics

---

# Author

**Avish Vijay Shetty**

Computer Engineering
D. J. Sanghvi College of Engineering

GitHub:

[https://github.com/avserver-16/dwaar-backend](https://github.com/avserver-16/dwaar-backend)

```

### One correction before you publish it

I would **not claim** some of the security features in the README until you've actually implemented them. In particular, from the code you've shown, these are still things to implement:

- Socket.IO JWT authentication
- Removing client-controlled `sender.id`
- Protecting all group routes with `authMiddleware`
- Removing `x-user-id` from private-message history
- Restricting production CORS
- Rate limiting/request validation

So if you want the README to describe the **current code exactly**, remove those items from the Security section for now. Otherwise, this README is structured to present the project as a high-quality backend architecture rather than just a collection of Express endpoints.
```
