const { z } = require("zod");

// MongoDB ObjectId validation regex (24-hex characters)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = z
  .string({ required_error: "ID must be a string." })
  .regex(OBJECT_ID_REGEX, { message: "Invalid ObjectId format." });

const updateLocationSchema = z.object({
  lat: z
    .number({ required_error: "Latitude is required and must be a number." })
    .min(-90, "Latitude must be >= -90.")
    .max(90, "Latitude must be <= 90."),
  lng: z
    .number({ required_error: "Longitude is required and must be a number." })
    .min(-180, "Longitude must be >= -180.")
    .max(180, "Longitude must be <= 180."),
  accuracy: z.number().optional().nullable(),
});

const sendPrivateMessageSchema = z.object({
  toUserId: objectIdSchema,
  message: z
    .string({ required_error: "Message is required." })
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message cannot exceed 2000 characters."),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional().default("TEXT"),
  attachment: z
    .object({
      url: z.string().optional(),
      publicId: z.string().optional(),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
    })
    .nullable()
    .optional(),
});

const sendGroupMessageSchema = z.object({
  groupId: objectIdSchema,
  message: z
    .string({ required_error: "Message is required." })
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message cannot exceed 2000 characters."),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "DOCUMENT"]).optional().default("TEXT"),
  attachment: z
    .object({
      url: z.string().optional(),
      publicId: z.string().optional(),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      size: z.number().optional(),
    })
    .nullable()
    .optional(),
});

const privateTypingSchema = z.object({
  toUserId: objectIdSchema,
  isTyping: z.boolean().optional().default(false),
});

const groupTypingSchema = z.object({
  groupId: objectIdSchema,
  isTyping: z.boolean().optional().default(false),
});

module.exports = {
  objectIdSchema,
  updateLocationSchema,
  sendPrivateMessageSchema,
  sendGroupMessageSchema,
  privateTypingSchema,
  groupTypingSchema,
};
