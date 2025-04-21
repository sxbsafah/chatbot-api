import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: {
    required: true,
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  accessToken: {
    type: String,
    unique: true,
  },

  verificationToken: {
    type: Number,
  },
  verificationTokenExpirationTime: {
    type: mongoose.SchemaTypes.Date,
  },
  rooms: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Room",
  },
});

export default mongoose.model("User", UserSchema);
