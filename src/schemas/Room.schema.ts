import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  user: {
    required: true,
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  conversations: {
    required: true,
    type: [
      {
        time: {
          required: true,
          default: () => new Date(Date.now()),
          type: mongoose.SchemaTypes.Date,
        },
        content: {
          required: true,
          type: String,
        },
        isFromBot: {
          required: true,
          type: Boolean,
        },
      },
    ],
    default: [],
  },
});

export default mongoose.model("Room", RoomSchema);
