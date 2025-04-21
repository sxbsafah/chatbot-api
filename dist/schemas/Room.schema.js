"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const RoomSchema = new mongoose_1.default.Schema({
    user: {
        required: true,
        type: mongoose_1.default.SchemaTypes.ObjectId,
        ref: "User",
    },
    conversations: {
        required: true,
        type: [
            {
                time: {
                    required: true,
                    default: () => new Date(Date.now()),
                    type: mongoose_1.default.SchemaTypes.Date,
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
exports.default = mongoose_1.default.model("Room", RoomSchema);
