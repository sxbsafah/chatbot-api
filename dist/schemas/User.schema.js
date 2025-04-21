"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const UserSchema = new mongoose_1.default.Schema({
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
        type: mongoose_1.default.SchemaTypes.Date,
    },
    rooms: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Room",
    },
});
exports.default = mongoose_1.default.model("User", UserSchema);
