const cloudinary = require("../config/cloudinary");
const Message = require("../sockets/message.model");
const getMessageType = require("../utils/filetype");

exports.uploadMessageFile = async (req, res) => {
  try {
    const file = req.file;

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "chat-files",
      resource_type: "auto",
    });

    const message = await Message.create({
      sender: req.user.id,
      type: getMessageType(file.mimetype),
      attachment: {
        url: result.secure_url,
        publicId: result.public_id,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};