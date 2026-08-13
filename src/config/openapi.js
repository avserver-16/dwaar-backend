const openapi = {
    openapi: "3.0.3",

    info: {
        title: "Dwaar API",
        version: "1.0.0",
        description:
            "REST API documentation for Dwaar, a pseudonymous hyperlocal community platform.",
    },

    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development",
        },
        {
            url: "https://dwaar-backend.onrender.com",
            description: "Production",
        },
    ],

    tags: [
        {
            name: "Health",
            description: "Server health monitoring",
        },
        {
            name: "Authentication",
            description: "User authentication and token management",
        },
        {
            name: "Users",
            description: "User management and location operations",
        },
        {
            name: "Spatial",
            description: "Geospatial proximity operations",
        },
        {
            name: "Upload",
            description: "File upload operations",
        },
        {
            name: "Messages",
            description: "Room and private messaging",
        },
        {
            name: "Groups",
            description: "Community group management",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT access token",
            },

            userIdHeader: {
                type: "apiKey",
                in: "header",
                name: "x-user-id",
                description:
                    "User ID used to identify the current user for private messaging",
            },
        },

        schemas: {
            User: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        example: "6a108e2d02739e86e3427c1a",
                    },
                    name: {
                        type: "string",
                        example: "Avish",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "avish@example.com",
                    },
                    phone: {
                        type: "string",
                        example: "9999999999",
                    },
                    location: {
                        $ref: "#/components/schemas/Location",
                    },
                    joinedRooms: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            Location: {
                type: "object",
                properties: {
                    latitude: {
                        type: "number",
                        example: 19.38955,
                    },
                    longitude: {
                        type: "number",
                        example: 72.82422,
                    },
                    city: {
                        type: "string",
                        example: "Vasai Virar",
                    },
                    region: {
                        type: "string",
                        example: "Maharashtra",
                    },
                    country: {
                        type: "string",
                        example: "India",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            Message: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "65f123abc456",
                    },
                    senderId: {
                        type: "string",
                        example: "6a108e2d02739e86e3427c1a",
                    },
                    type: {
                        type: "string",
                        example: "text",
                    },
                    attachment: {
                        nullable: true,
                        example: null,
                    },
                    content: {
                        type: "string",
                        example: "Hello everyone!",
                    },
                    roomId: {
                        type: "string",
                        example: "room_123",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                    },
                },
            },

            Group: {
                type: "object",
                properties: {
                    _id: {
                        type: "string",
                        example: "65f123abc456",
                    },
                    name: {
                        type: "string",
                        example: "Building Community",
                    },
                    description: {
                        type: "string",
                        example: "Community group for residents",
                    },
                    admin: {
                        type: "string",
                        example: "6a108e2d02739e86e3427c1a",
                    },
                    members: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    category: {
                        type: "string",
                        example: "Community",
                    },
                    subCategory: {
                        type: "string",
                        example: "Residential",
                    },
                },
            },

            Error: {
                type: "object",
                properties: {
                    error: {
                        type: "string",
                        example: "Unauthorized",
                    },
                    details: {
                        type: "string",
                        example: "Something went wrong",
                    },
                },
            },
        },
    },

    paths: {
        // =========================================================
        // HEALTH
        // =========================================================

        "/health": {
            get: {
                summary: "Health check",
                tags: ["Health"],

                responses: {
                    200: {
                        description: "Server is healthy",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "string",
                                            example: "OK",
                                        },
                                        uptime: {
                                            type: "number",
                                            example: 125.42,
                                        },
                                        timestamp: {
                                            type: "string",
                                            format: "date-time",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        // =========================================================
        // AUTHENTICATION
        // =========================================================

        "/api/users/login": {
            post: {
                summary: "User login",
                tags: ["Authentication"],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["phone", "password"],
                                properties: {
                                    phone: {
                                        type: "string",
                                        example: "9999999999",
                                    },
                                    password: {
                                        type: "string",
                                        format: "password",
                                        example: "password123",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Login successful",
                    },
                    401: {
                        description: "Invalid credentials",
                    },
                },
            },
        },

        "/api/users/logout": {
            post: {
                summary: "User logout",
                tags: ["Authentication"],
                security: [{ bearerAuth: [] }],

                responses: {
                    200: {
                        description: "Logout successful",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/refresh-token": {
            post: {
                summary: "Refresh access token",
                tags: ["Authentication"],

                responses: {
                    200: {
                        description: "Access token refreshed",
                    },
                    401: {
                        description: "Invalid or expired refresh token",
                    },
                },
            },
        },

        // =========================================================
        // USERS
        // =========================================================

        "/api/users": {
            post: {
                summary: "Create user",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "name",
                                    "email",
                                    "phone",
                                    "password",
                                ],
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Avish",
                                    },
                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "avish@example.com",
                                    },
                                    phone: {
                                        type: "string",
                                        example: "9999999999",
                                    },
                                    password: {
                                        type: "string",
                                        format: "password",
                                        example: "password123",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: "User created successfully",
                    },
                    400: {
                        description: "Invalid user data",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },

            get: {
                summary: "Get all users",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                responses: {
                    200: {
                        description: "Users retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/User",
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/check-phone": {
            post: {
                summary: "Check whether a phone number exists",
                tags: ["Users"],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["phone"],
                                properties: {
                                    phone: {
                                        type: "string",
                                        example: "9999999999",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Phone lookup completed",
                    },
                },
            },
        },

        "/api/users/{id}": {
            get: {
                summary: "Get user by ID",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "6a108e2d02739e86e3427c1a",
                    },
                ],

                responses: {
                    200: {
                        description: "User retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/User",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    404: {
                        description: "User not found",
                    },
                },
            },

            put: {
                summary: "Update user",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Avish Shetty",
                                    },
                                    email: {
                                        type: "string",
                                        example: "avish@example.com",
                                    },
                                    phone: {
                                        type: "string",
                                        example: "9999999999",
                                    },
                                    password: {
                                        type: "string",
                                        example: "newPassword123",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "User updated successfully",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    404: {
                        description: "User not found",
                    },
                },
            },

            delete: {
                summary: "Delete user",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    200: {
                        description: "User deleted successfully",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                    404: {
                        description: "User not found",
                    },
                },
            },
        },

        "/api/users/get-location": {
            get: {
                summary: "Get authenticated user's location",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                responses: {
                    200: {
                        description: "Location retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/Location",
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/add-location": {
            post: {
                summary: "Add or update user location",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/Location",
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Location updated successfully",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/nearby-buildings": {
            post: {
                summary: "Get nearby buildings for authenticated user",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                responses: {
                    200: {
                        description: "Nearby buildings retrieved",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/join-room": {
            post: {
                summary: "Join a room",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["roomId"],
                                properties: {
                                    roomId: {
                                        type: "string",
                                        example: "room_123",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Room joined successfully",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        "/api/users/joined-rooms": {
            get: {
                summary: "Get rooms joined by authenticated user",
                tags: ["Users"],
                security: [{ bearerAuth: [] }],

                responses: {
                    200: {
                        description: "Joined rooms retrieved",
                    },
                    401: {
                        description: "Unauthorized",
                    },
                },
            },
        },

        // =========================================================
        // SPATIAL
        // =========================================================

        "/api/spatial/nearby": {
            post: {
                summary: "Find nearby buildings",
                tags: ["Spatial"],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["latitude", "longitude"],
                                properties: {
                                    latitude: {
                                        type: "number",
                                        example: 19.38955,
                                    },
                                    longitude: {
                                        type: "number",
                                        example: 72.82422,
                                    },
                                    radius: {
                                        type: "number",
                                        example: 1000,
                                        description:
                                            "Search radius in meters",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Nearby buildings retrieved",
                    },
                    400: {
                        description: "Invalid coordinates",
                    },
                },
            },
        },

        "/api/spatial/nearby-rooms": {
            post: {
                summary: "Find nearby rooms",
                tags: ["Spatial"],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["latitude", "longitude"],
                                properties: {
                                    latitude: {
                                        type: "number",
                                        example: 19.38955,
                                    },
                                    longitude: {
                                        type: "number",
                                        example: 72.82422,
                                    },
                                    radius: {
                                        type: "number",
                                        example: 1000,
                                        description:
                                            "Search radius in meters",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Nearby rooms retrieved",
                    },
                    400: {
                        description: "Invalid coordinates",
                    },
                },
            },
        },

        // =========================================================
        // UPLOAD
        // =========================================================

        "/api/upload": {
            post: {
                summary: "Upload file",
                tags: ["Upload"],

                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["file"],
                                properties: {
                                    file: {
                                        type: "string",
                                        format: "binary",
                                        description: "File to upload",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "File uploaded successfully",
                    },
                    400: {
                        description: "File upload failed",
                    },
                },
            },
        },

        // =========================================================
        // MESSAGES
        // =========================================================

        "/api/messages/rooms/{roomId}": {
            get: {
                summary: "Get room messages",
                tags: ["Messages"],

                parameters: [
                    {
                        name: "roomId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "room_123",
                    },
                ],

                responses: {
                    200: {
                        description: "Room messages retrieved",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Message",
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: "Failed to fetch room messages",
                    },
                },
            },
        },

        "/api/messages/private/{toUserId}": {
            get: {
                summary: "Get private messages",
                description:
                    "Returns private messages between the current user and the specified user. The current user ID is provided using the x-user-id header.",
                tags: ["Messages"],

                security: [
                    {
                        userIdHeader: [],
                    },
                ],

                parameters: [
                    {
                        name: "toUserId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "6a108e2d02739e86e3427c1a",
                    },
                ],

                responses: {
                    200: {
                        description: "Private messages retrieved",
                    },
                    500: {
                        description: "Failed to fetch private messages",
                    },
                },
            },
        },

        // =========================================================
        // GROUPS
        // =========================================================

        "/api/groups": {
            post: {
                summary: "Create group",
                tags: ["Groups"],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "adminId"],
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "Building Community",
                                    },
                                    description: {
                                        type: "string",
                                        example:
                                            "Community group for residents",
                                    },
                                    adminId: {
                                        type: "string",
                                        example:
                                            "6a108e2d02739e86e3427c1a",
                                    },
                                    memberIds: {
                                        type: "array",
                                        items: {
                                            type: "string",
                                        },
                                        example: [],
                                    },
                                    category: {
                                        type: "string",
                                        example: "Community",
                                    },
                                    subCategory: {
                                        type: "string",
                                        example: "Residential",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    201: {
                        description: "Group created successfully",
                    },
                    500: {
                        description: "Failed to create group",
                    },
                },
            },
        },

        "/api/groups/user/{userId}": {
            get: {
                summary: "Get groups for a user",
                tags: ["Groups"],

                parameters: [
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "6a108e2d02739e86e3427c1a",
                    },
                ],

                responses: {
                    200: {
                        description: "Groups retrieved successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        $ref: "#/components/schemas/Group",
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: "Failed to fetch groups",
                    },
                },
            },
        },

        "/api/groups/{groupId}/members": {
            post: {
                summary: "Add member to group",
                tags: ["Groups"],

                parameters: [
                    {
                        name: "groupId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                        example: "65f123abc456",
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["userId"],
                                properties: {
                                    userId: {
                                        type: "string",
                                        example:
                                            "6a108e2d02739e86e3427c1a",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Member added successfully",
                    },
                    500: {
                        description: "Failed to add member",
                    },
                },
            },
        },

        "/api/groups/{groupId}/members/{userId}": {
            delete: {
                summary: "Remove member from group",
                tags: ["Groups"],

                parameters: [
                    {
                        name: "groupId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                    {
                        name: "userId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    200: {
                        description: "Member removed successfully",
                    },
                    500: {
                        description: "Failed to remove member",
                    },
                },
            },
        },

        "/api/groups/{groupId}/messages": {
            get: {
                summary: "Get group messages",
                tags: ["Groups"],

                parameters: [
                    {
                        name: "groupId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                responses: {
                    200: {
                        description: "Group messages retrieved",
                    },
                    500: {
                        description: "Failed to fetch group messages",
                    },
                },
            },
        },

        "/api/groups/{groupId}/join": {
            post: {
                summary: "Join a group",
                tags: ["Groups"],

                parameters: [
                    {
                        name: "groupId",
                        in: "path",
                        required: true,
                        schema: {
                            type: "string",
                        },
                    },
                ],

                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["userId"],
                                properties: {
                                    userId: {
                                        type: "string",
                                        example:
                                            "6a108e2d02739e86e3427c1a",
                                    },
                                },
                            },
                        },
                    },
                },

                responses: {
                    200: {
                        description: "Joined group successfully",
                    },
                    500: {
                        description: "Failed to join group",
                    },
                },
            },
        },
    },
};

module.exports = openapi;