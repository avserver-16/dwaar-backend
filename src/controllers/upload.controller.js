const cloudinary = require("../config/cloudinary");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "dwaar",
      resource_type: "auto", // detects image, video, pdf automatically
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      file: {
        public_id: result.public_id,
        url: result.secure_url,
        resource_type: result.resource_type,
        format: result.format,
        bytes: result.bytes,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  uploadFile,
};