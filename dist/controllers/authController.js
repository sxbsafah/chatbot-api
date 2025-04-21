"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.verifyTokenController = exports.registerController = exports.loginController = exports.authControllerVerifier = void 0;
const User_schema_1 = __importDefault(require("../schemas/User.schema"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = require("dotenv");
const mailtrap_config_1 = require("../mailtrap/mailtrap.config");
const emailTemplates_1 = require("../mailtrap/emailTemplates");
(0, dotenv_1.config)();
const authControllerVerifier = (request, response, next) => {
    const { authorization } = request.body;
    try {
        const payload = jsonwebtoken_1.default.verify(authorization, process.env.ACCESS_TOKEN_SECRET);
        return response.status(200).json({ message: "" });
    }
    catch (error) {
        next();
    }
};
exports.authControllerVerifier = authControllerVerifier;
const loginController = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = request.body;
    try {
        if (!email || !password)
            return response
                .status(400)
                .json({ status: 400, message: "Please Provide All The Fields" });
        const user = yield User_schema_1.default.findOne({ email });
        if (!user)
            return response
                .status(400)
                .send({ status: 400, message: "User Does Not Exist" });
        const isMatch = bcrypt_1.default.compare(user.password, password);
        if (!isMatch)
            return response
                .status(400)
                .send({ status: 400, message: "incorrect Password" });
        if (!user.isVerified) {
            if (!user.verificationTokenExpirationTime ||
                !user.verificationToken ||
                user.verificationTokenExpirationTime < new Date()) {
                const OTP = Math.round(100000 + Math.random() * 900000);
                yield mailtrap_config_1.client.send({
                    from: {
                        email: process.env.MAIL_TRAP_EMAIL_SENDER,
                        name: "ChatBot",
                    },
                    to: [{ email: "chatbotusthb2005@gmail.com" }],
                    subject: "ChatBot OTP Auth",
                    text: `your OTP is ${OTP}`,
                    category: "Integration Test",
                    html: (0, emailTemplates_1.otpEmailTemplateGnerator)(OTP),
                });
                user.verificationToken = OTP;
                user.verificationTokenExpirationTime = new Date(Date.now() + 20 * 60 * 1000);
                yield user.save();
            }
            return response
                .status(200)
                .json({
                status: 200,
                message: "verify email",
                redirect: "/auth/verify",
            });
        }
        const accessToken = jsonwebtoken_1.default.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "7d" });
        yield User_schema_1.default.updateOne({ email }, { $set: { accessToken } });
        return response
            .status(200)
            .json({
            status: 200,
            message: "User LoggedIn Succesfuly",
            redirect: "/",
        });
    }
    catch (error) {
        console.log(error);
        return response
            .status(500)
            .json({
            status: 500,
            message: "Internal Server Error, Please Try Again",
        });
    }
});
exports.loginController = loginController;
const registerController = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = request.body;
    try {
        if (!email || !password)
            return response
                .status(400)
                .json({ status: 400, message: "Please Provide All The Fields" });
        const user = yield User_schema_1.default.findOne({ email });
        if (user)
            return response
                .status(400)
                .json({
                status: 400,
                message: "This Email is Already Asociated With An Account",
            });
        yield new User_schema_1.default({ email, password: yield bcrypt_1.default.hash(password, 10) }).save();
        return response
            .status(200)
            .send({
            status: 200,
            redirect: "/auth/login",
            message: "User Created Succesfuly",
        });
    }
    catch (error) {
        console.log(error);
        return response
            .status(500)
            .json({ status: 500, message: "Internal Server Error" });
    }
});
exports.registerController = registerController;
const verifyTokenController = (request, response, next) => {
    const { authorization: token } = request.cookies;
    try {
        if (!token)
            return response
                .status(401)
                .json({ status: 400, message: "Unauthorized" });
        const payload = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
        request.payload = payload;
        next();
    }
    catch (error) {
        return response.status(400).json({ status: 401, messsage: "Unauthorized" });
    }
};
exports.verifyTokenController = verifyTokenController;
const verifyOTP = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp } = request.body;
    try {
        if (!otp)
            return response
                .status(400)
                .json({ status: 400, message: "Please Provide The Otp" });
        const user = yield User_schema_1.default.findOne({ verificationToken: otp });
        if (!user)
            return response
                .status(400)
                .json({ message: "No User Match This OTP", status: 400 });
        if (user.isVerified)
            return response
                .status(400)
                .json({ status: 400, message: "User Already Verified" });
        if (user.verificationTokenExpirationTime > new Date()) {
            user.isVerified = true;
            const token = jsonwebtoken_1.default.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET);
            response.cookie("ACCESS_TOKEN", token, {
                maxAge: 1000 * 60 * 60 * 24 * 7,
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                sameSite: "strict",
            });
            user.accessToken = token;
            yield user.save();
            return response
                .status(200)
                .json({ message: "verified Succefuly", redirect: "/", status: 200 });
        }
        return response
            .status(400)
            .json({ message: "Verification Token Expired", status: 400 });
    }
    catch (error) {
        console.log(error);
        return response
            .status(500)
            .json({
            message: "Internal Server Error Please Try Again Later",
            status: 500,
        });
    }
});
exports.verifyOTP = verifyOTP;
