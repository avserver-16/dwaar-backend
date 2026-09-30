# Dwaar Backend API Documentation

## Overview

This document provides comprehensive API documentation for the Dwaar backend, including all endpoints, authentication requirements, request/response formats, and testing instructions.

**Base URL (Local):** `http://localhost:5000`
**Base URL (Production):** `https://dwaar-backend.onrender.com`

**Interactive Documentation:** `/docs` (Scalar API Reference)

---

## Authentication

The API uses JWT (JSON Web Token) based authentication. Most endpoints require authentication using an access token.

### Authentication Flow

1. **Login** - Get access token and refresh token
2. **Use Access Token** - Include in Authorization header for protected routes
3. **Refresh Token** - Use refresh token to get new access token when expired

### Header Format

```http
Authorization: Bearer <access_token>
```

### Token Endpoints

- **POST** `/api/users/login` - Login and get tokens
- **POST** `/api/users/refresh-token` - Refresh access token
- **POST** `/api/users/logout` - Logout

---

## Data Models

### User Model

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "email": "string (required, unique)",
  "phone": "string (required, unique)",
  "password": "string (required, hashed)",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "city": "string",
    "region": "string",
    "country": "string",
    "updatedAt": "Date"
  },
  "joinedRooms": [
    {
      "roomId": "ObjectId",
      "joinedAt": "Date"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Room Model

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "description": "string",
  "category": "string (default: 'general')",
  "createdBy": "ObjectId (ref: User)",
  "members": ["ObjectId"],
  "maxMembers": "number (default: 100)",
  "location": {
    "latitude": "number",
    "longitude": "number",
    "city": "string",
    "region": "string",
    "country": "string"
  },
  "radius": "number (default: 1000)",
  "isActive": "boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Group Model

```json
{
  "_id": "ObjectId",
  "name": "string (required)",
  "description": "string",
  "avatar": "string",
  "admin": "ObjectId (ref: User, required)",
  "members": ["ObjectId"],
  "category": "string",
  "subCategory": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Message Model

```json
{
  "_id": "ObjectId",
  "sender": "ObjectId (ref: User, required)",
  "message": "string",
  "type": "TEXT | IMAGE | VIDEO | DOCUMENT",
  "attachment": {
    "url": "string",
    "publicId": "string",
    "fileName": "string",
    "mimeType": "string",
    "size": "number"
  },
  "roomId": "string",
  "recipient": "ObjectId (ref: User)",
  "groupId": "ObjectId (ref: Group)",
  "isPrivate": "boolean (default: false)",
  "readAt": "Date",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

## API Endpoints

### Health Check

#### GET /health

Check server health status.

**Authentication:** None

**Response:**
```json
{
  "status": "OK",
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:5000/health
```

---

## User APIs

Base URL: `/api/users`

### POST /api/users/

Create a new user.

**Authentication:** None

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "location": null,
  "joinedRooms": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","phone":"1234567890","password":"securePassword123"}'
```

---

### POST /api/users/check-phone

Check if a user exists by phone number.

**Authentication:** None

**Request Body:**
```json
{
  "phone": "1234567890"
}
```

**Response (200):**
```json
{
  "exists": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/check-phone \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890"}'
```

---

### POST /api/users/login

Login with phone/email and password.

**Authentication:** None

**Request Body:**
```json
{
  "phone": "1234567890",
  "password": "securePassword123"
}
```

OR

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1234567890","password":"securePassword123"}'
```

---

### POST /api/users/refresh-token

Refresh access token using refresh token.

**Authentication:** None

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token"}'
```

---

### GET /api/users/me

Get current user profile.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "city": "San Francisco",
    "region": "California",
    "country": "USA",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "joinedRooms": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer your_access_token"
```

---

### GET /api/users/

Get all users (admin/user list).

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "location": null,
    "joinedRooms": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/users/ \
  -H "Authorization: Bearer your_access_token"
```

---

### GET /api/users/:id

Get user by ID.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "location": null,
  "joinedRooms": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl http://localhost:5000/api/users/user_id \
  -H "Authorization: Bearer your_access_token"
```

---

### PUT /api/users/:id

Update user by ID.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

**Response (200):**
```json
{
  "_id": "user_id",
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "1234567890",
  "location": null,
  "joinedRooms": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Example:**
```bash
curl -X PUT http://localhost:5000/api/users/user_id \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"name":"John Updated"}'
```

---

### DELETE /api/users/:id

Delete user by ID.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "msg": "User deleted"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/users/user_id \
  -H "Authorization: Bearer your_access_token"
```

---

### POST /api/users/logout

Logout user.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "msg": "Logout successful"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/logout \
  -H "Authorization: Bearer your_access_token"
```

---

### GET /api/users/get-location

Get current user's location.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "city": "San Francisco",
    "region": "California",
    "country": "USA",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl http://localhost:5000/api/users/get-location \
  -H "Authorization: Bearer your_access_token"
```

---

### POST /api/users/add-location

Add or update user's location.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "city": "San Francisco",
  "region": "California",
  "country": "USA"
}
```

**Response (200):**
```json
{
  "msg": "Location updated successfully",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "city": "San Francisco",
      "region": "California",
      "country": "USA",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "joinedRooms": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/add-location \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"latitude":37.7749,"longitude":-122.4194,"city":"San Francisco","region":"California","country":"USA"}'
```

---

### POST /api/users/nearby-buildings

Find nearby buildings based on user's location.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "radius": 500
}
```

**Response (200):**
```json
{
  "success": true,
  "radius": 500,
  "buildingCount": 10,
  "userLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "city": "San Francisco",
    "region": "California",
    "country": "USA"
  },
  "buildings": [
    {
      "id": "building_id",
      "name": "Building Name",
      "latitude": 37.7750,
      "longitude": -122.4195
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/nearby-buildings \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"radius":500}'
```

---

### POST /api/users/join-room

Join a room.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "roomId": "room_id"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Room joined successfully",
  "joinedRooms": [
    {
      "roomId": "room_id",
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/users/join-room \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room_id"}'
```

---

### GET /api/users/joined-rooms

Get all rooms joined by the current user.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "joinedRooms": [
    {
      "roomId": {
        "_id": "room_id",
        "name": "Room Name",
        "description": "Room Description",
        "category": "general",
        "createdBy": "user_id",
        "members": ["user_id"],
        "maxMembers": 100,
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "radius": 1000,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      "joinedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:5000/api/users/joined-rooms \
  -H "Authorization: Bearer your_access_token"
```

---

## Spatial APIs

Base URL: `/api/spatial`

### POST /api/spatial/nearby

Find nearby buildings based on coordinates and radius.

**Authentication:** None

**Request Body:**
```json
{
  "lat": 37.7749,
  "lon": -122.4194,
  "radius": 500
}
```

**Validation:**
- `lat`: Number between -90 and 90
- `lon`: Number between -180 and 180
- `radius`: Positive number (max 50,000 meters)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "building_id",
      "name": "Building Name",
      "latitude": 37.7750,
      "longitude": -122.4195
    }
  ]
}
```

**Response (400):**
```json
{
  "success": false,
  "errors": [
    "lat must be a number between -90 and 90"
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/spatial/nearby \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lon":-122.4194,"radius":500}'
```

---

### POST /api/spatial/nearby-rooms

Find nearby rooms based on coordinates and radius.

**Authentication:** None

**Request Body:**
```json
{
  "lat": 37.7749,
  "lon": -122.4194,
  "radius": 500
}
```

**Validation:**
- `lat`: Number between -90 and 90
- `lon`: Number between -180 and 180
- `radius`: Positive number (max 50,000 meters)

**Response (200):**
```json
{
  "success": true,
  "query": {
    "lat": 37.7749,
    "lon": -122.4194,
    "radius_m": 500
  },
  "summary": {
    "total_rooms": 15,
    "full_rooms": 5,
    "partial_rooms": 10
  },
  "data": [
    {
      "_id": "room_id",
      "name": "Room Name",
      "description": "Room Description",
      "location": {
        "latitude": 37.7750,
        "longitude": -122.4195
      }
    }
  ]
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/spatial/nearby-rooms \
  -H "Content-Type: application/json" \
  -d '{"lat":37.7749,"lon":-122.4194,"radius":500}'
```

---

## Group APIs

Base URL: `/api/groups`

### POST /api/groups/

Create a new group.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Group Name",
  "description": "Group Description",
  "adminId": "admin_user_id",
  "memberIds": ["user_id_1", "user_id_2"],
  "category": "general",
  "subCategory": "subcategory"
}
```

**Response (201):**
```json
{
  "_id": "group_id",
  "name": "Group Name",
  "description": "Group Description",
  "avatar": null,
  "admin": "admin_user_id",
  "members": ["admin_user_id", "user_id_1", "user_id_2"],
  "category": "general",
  "subCategory": "subcategory",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/groups/ \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Group Name","description":"Group Description","adminId":"admin_user_id","memberIds":["user_id_1"],"category":"general"}'
```

---

### GET /api/groups/user/:userId

Get all groups for a specific user.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "_id": "group_id",
    "name": "Group Name",
    "description": "Group Description",
    "avatar": null,
    "admin": "admin_user_id",
    "members": ["admin_user_id", "user_id_1"],
    "category": "general",
    "subCategory": "subcategory",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/groups/user/user_id \
  -H "Authorization: Bearer your_access_token"
```

---

### POST /api/groups/:groupId/members

Add a member to a group.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_id_to_add"
}
```

**Response (200):**
```json
{
  "_id": "group_id",
  "name": "Group Name",
  "description": "Group Description",
  "avatar": null,
  "admin": "admin_user_id",
  "members": ["admin_user_id", "user_id_1", "user_id_to_add"],
  "category": "general",
  "subCategory": "subcategory",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/groups/group_id/members \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_id_to_add"}'
```

---

### DELETE /api/groups/:groupId/members/:userId

Remove a member from a group.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "_id": "group_id",
  "name": "Group Name",
  "description": "Group Description",
  "avatar": null,
  "admin": "admin_user_id",
  "members": ["admin_user_id", "user_id_1"],
  "category": "general",
  "subCategory": "subcategory",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/groups/group_id/members/user_id \
  -H "Authorization: Bearer your_access_token"
```

---

### GET /api/groups/:groupId/messages

Get all messages for a specific group.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "message_id",
    "senderId": "sender_user_id",
    "type": "TEXT",
    "attachment": null,
    "content": "Message content",
    "groupId": "group_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/groups/group_id/messages \
  -H "Authorization: Bearer your_access_token"
```

---

### POST /api/groups/:groupId/join

Join a group.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_id"
}
```

**Response (200):**
```json
{
  "_id": "group_id",
  "name": "Group Name",
  "description": "Group Description",
  "avatar": null,
  "admin": "admin_user_id",
  "members": ["admin_user_id", "user_id_1", "user_id"],
  "category": "general",
  "subCategory": "subcategory",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T01:00:00.000Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/groups/group_id/join \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_id"}'
```

---

## Messaging APIs

Base URL: `/api/messages`

### GET /api/messages/rooms/:roomId

Get all messages for a specific room (public messages only).

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "message_id",
    "senderId": "sender_user_id",
    "type": "TEXT",
    "attachment": null,
    "content": "Message content",
    "roomId": "room_id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/messages/rooms/room_id \
  -H "Authorization: Bearer your_access_token"
```

---

### GET /api/messages/private/:toUserId

Get private messages between current user and another user.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
X-User-Id: current_user_id
```

**Response (200):**
```json
[
  {
    "id": "message_id",
    "senderId": "sender_user_id",
    "type": "TEXT",
    "attachment": null,
    "content": "Message content",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isPrivate": true
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/messages/private/other_user_id \
  -H "Authorization: Bearer your_access_token" \
  -H "X-User-Id: current_user_id"
```

---

## Conversation APIs

Base URL: `/api/conversations`

### GET /api/conversations/:userId

Get all conversations for a specific user.

**Authentication:** Required

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "_id": "other_user_id",
    "participants": [
      {
        "_id": "other_user_id",
        "name": "Other User Name"
      }
    ],
    "lastMessage": {
      "message": "Last message content",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
]
```

**Example:**
```bash
curl http://localhost:5000/api/conversations/user_id \
  -H "Authorization: Bearer your_access_token"
```

---

## Upload APIs

Base URL: `/api/upload`

### POST /api/upload/

Upload a file to Cloudinary.

**Authentication:** None

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file`: File to upload (form field name)

**Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "public_id": "dwaar/abc123",
    "url": "https://res.cloudinary.com/cloud_name/image/upload/...",
    "resource_type": "image",
    "format": "jpg",
    "bytes": 12345
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/upload/ \
  -F "file=@/path/to/file.jpg"
```

---

## Socket.IO Real-Time Events

### Connection

Connect to the Socket.IO server with authentication:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_access_token'
  }
});
```

### Presence Events

#### register_user (Client → Server)
Register user's socket connection.

```javascript
socket.emit('register_user', { userId: 'user_id' });
```

#### online_users (Server → Client)
Get list of online users.

```javascript
socket.on('online_users', (users) => {
  console.log('Online users:', users);
});
```

#### user_offline (Server → Client)
Emitted when a user goes offline.

```javascript
socket.on('user_offline', (userId) => {
  console.log('User offline:', userId);
});
```

### Private Messaging Events

#### send_private_message (Client → Server)
Send a private message to a user.

```javascript
socket.emit('send_private_message', {
  recipientId: 'recipient_user_id',
  message: 'Hello!',
  type: 'TEXT',
  attachment: null
});
```

#### receive_private_message (Server → Client)
Receive a private message.

```javascript
socket.on('receive_private_message', (message) => {
  console.log('Private message:', message);
});
```

#### private_typing (Bidirectional)
Typing indicator for private chat.

```javascript
// Send typing indicator
socket.emit('private_typing', {
  recipientId: 'recipient_user_id',
  isTyping: true
});

// Receive typing indicator
socket.on('private_typing', (data) => {
  console.log('User typing:', data);
});
```

#### private_message_error (Server → Client)
Error in private message sending.

```javascript
socket.on('private_message_error', (error) => {
  console.error('Message error:', error);
});
```

### Group Messaging Events

#### join_group (Client → Server)
Join a group room.

```javascript
socket.emit('join_group', { groupId: 'group_id' });
```

#### join_groups (Client → Server)
Join multiple groups at once.

```javascript
socket.emit('join_groups', { groupIds: ['group_id_1', 'group_id_2'] });
```

#### leave_group (Client → Server)
Leave a group room.

```javascript
socket.emit('leave_group', { groupId: 'group_id' });
```

#### send_group_message (Client → Server)
Send a message to a group.

```javascript
socket.emit('send_group_message', {
  groupId: 'group_id',
  message: 'Hello group!',
  type: 'TEXT',
  attachment: null
});
```

#### receive_group_message (Server → Client)
Receive a group message.

```javascript
socket.on('receive_group_message', (message) => {
  console.log('Group message:', message);
});
```

#### group_typing (Bidirectional)
Typing indicator for group chat.

```javascript
// Send typing indicator
socket.emit('group_typing', {
  groupId: 'group_id',
  isTyping: true
});

// Receive typing indicator
socket.on('group_typing', (data) => {
  console.log('User typing in group:', data);
});
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Error message"
}
```

### 401 Unauthorized

```json
{
  "msg": "No token provided from here"
}
```

OR

```json
{
  "msg": "Unauthorized",
  "error": "Invalid token"
}
```

### 404 Not Found

```json
{
  "msg": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error message"
}
```

---

## Testing Guide

### 1. Setup Environment

Ensure the server is running:
```bash
npm run dev
```

Server will be available at `http://localhost:5000`

### 2. Create a Test User

```bash
curl -X POST http://localhost:5000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "1234567890",
    "password": "test123"
  }'
```

### 3. Login to Get Token

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "1234567890",
    "password": "test123"
  }'
```

Save the `token` from the response for authenticated requests.

### 4. Test Authenticated Endpoints

Replace `YOUR_TOKEN` with the actual token from login:

```bash
# Get current user
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add location
curl -X POST http://localhost:5000/api/users/add-location \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "city": "San Francisco",
    "region": "California",
    "country": "USA"
  }'

# Find nearby buildings
curl -X POST http://localhost:5000/api/users/nearby-buildings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"radius": 500}'
```

### 5. Test Spatial Endpoints

```bash
# Find nearby buildings by coordinates
curl -X POST http://localhost:5000/api/spatial/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7749,
    "lon": -122.4194,
    "radius": 500
  }'

# Find nearby rooms
curl -X POST http://localhost:5000/api/spatial/nearby-rooms \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 37.7749,
    "lon": -122.4194,
    "radius": 500
  }'
```

### 6. Test Group Endpoints

```bash
# Create a group
curl -X POST http://localhost:5000/api/groups/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Group",
    "description": "A test group",
    "adminId": "YOUR_USER_ID",
    "category": "general"
  }'

# Get user's groups
curl http://localhost:5000/api/groups/user/YOUR_USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 7. Test File Upload

```bash
# Upload a file
curl -X POST http://localhost:5000/api/upload/ \
  -F "file=@/path/to/your/file.jpg"
```

### 8. Test Socket.IO Connection

Use a Socket.IO client or browser console:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  
  // Register user
  socket.emit('register_user', { userId: 'YOUR_USER_ID' });
  
  // Listen for online users
  socket.on('online_users', (users) => {
    console.log('Online users:', users);
  });
});
```

---

## Environment Variables

Required environment variables for the backend:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/dwaar
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:3000
```

---

## Notes

- Phone numbers are normalized (non-numeric characters removed)
- Passwords are hashed using bcrypt
- JWT access tokens expire in 7 days
- JWT refresh tokens expire in 30 days
- Spatial queries have a maximum radius of 50,000 meters
- File uploads are stored on Cloudinary
- All timestamps are in ISO 8601 format
- IDs are MongoDB ObjectId strings

---

## Interactive Documentation

Visit `/docs` on the running server for interactive API documentation powered by Scalar:

- Local: `http://localhost:5000/docs`
- Production: `https://dwaar-backend.onrender.com/docs`
