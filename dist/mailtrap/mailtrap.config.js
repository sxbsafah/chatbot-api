"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const mailtrap_1 = require("mailtrap");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const TOKEN = process.env.MAIL_TRAP_TOKEN;
exports.client = new mailtrap_1.MailtrapClient({
    token: TOKEN,
});
