const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    set: (v) => v.replace(/\D/g, ""),
  },

  password: {
    type: String,
    required: true,
  },

  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    region: String,
    country: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },

  joinedRooms: [
    {
      roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
}, { timestamps: true });


// Hash password before saving
userSchema.pre("save", async function () {

  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});


// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};


// Generate JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = mongoose.model("User", userSchema);