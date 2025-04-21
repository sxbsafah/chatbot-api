import { NextFunction, Request, Response } from "express-serve-static-core";
import User from "../schemas/User.schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "dotenv";
import { client } from "../mailtrap/mailtrap.config";
import { otpEmailTemplateGnerator } from "../mailtrap/emailTemplates";

config();

interface RequestBody {
  email?: string;
  password?: string;
  otp?: string;
}

interface ResponseBody {
  status: number;
  message: string;
  redirect?: string;
  data?: Room[];
}

interface Conversation {
  time: Date;
  content: string;
  isFromBot: boolean;
}

interface Room {
  conversations: Conversation[];
}

interface IJwtRequest extends Request {
  cookies: { authorization?: string };
  payload?: string | jwt.JwtPayload;
}

export const authControllerVerifier = (
  request: IJwtRequest,
  response: Response,
  next: NextFunction
) => {
  const { authorization } = request.body;
  try {
    const payload = jwt.verify(
      authorization,
      process.env.ACCESS_TOKEN_SECRET as string
    );
    return response.status(200).json({ message: "" });
  } catch (error) {
    next();
  }
};

export const loginController = async (
  request: Request<{}, {}, RequestBody>,
  response: Response<ResponseBody>
) => {
  const { email, password } = request.body;
  try {
    if (!email || !password)
      return response
        .status(400)
        .json({ status: 400, message: "Please Provide All The Fields" });

    const user = await User.findOne({ email });

    if (!user)
      return response
        .status(400)
        .send({ status: 400, message: "User Does Not Exist" });

    const isMatch = bcrypt.compare(user.password, password);

    if (!isMatch)
      return response
        .status(400)
        .send({ status: 400, message: "incorrect Password" });

    if (!user.isVerified) {
      if (
        !user.verificationTokenExpirationTime ||
        !user.verificationToken ||
        user.verificationTokenExpirationTime < new Date()
      ) {
        const OTP = Math.round(100000 + Math.random() * 900000);
        await client.send({
          from: {
            email: process.env.MAIL_TRAP_EMAIL_SENDER as string,
            name: "ChatBot",
          },
          to: [{ email: "chatbotusthb2005@gmail.com" }],
          subject: "ChatBot OTP Auth",
          text: `your OTP is ${OTP}`,
          category: "Integration Test",
          html: otpEmailTemplateGnerator(OTP),
        });
        user.verificationToken = OTP;
        user.verificationTokenExpirationTime = new Date(
          Date.now() + 20 * 60 * 1000
        );
        await user.save();
      }
      return response
        .status(200)
        .json({
          status: 200,
          message: "verify email",
          redirect: "/auth/verify",
        });
    }
    const accessToken = jwt.sign(
      { email },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    await User.updateOne({ email }, { $set: { accessToken } });

    return response
      .status(200)
      .json({
        status: 200,
        message: "User LoggedIn Succesfuly",
        redirect: "/",
      });
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json({
        status: 500,
        message: "Internal Server Error, Please Try Again",
      });
  }
};

export const registerController = async (
  request: Request<{}, {}, RequestBody>,
  response: Response<ResponseBody>
) => {
  const { email, password } = request.body;
  try {
    if (!email || !password)
      return response
        .status(400)
        .json({ status: 400, message: "Please Provide All The Fields" });

    const user = await User.findOne({ email });

    if (user)
      return response
        .status(400)
        .json({
          status: 400,
          message: "This Email is Already Asociated With An Account",
        });

    await new User({ email, password: await bcrypt.hash(password, 10) }).save();
    return response
      .status(200)
      .send({
        status: 200,
        redirect: "/auth/login",
        message: "User Created Succesfuly",
      });
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json({ status: 500, message: "Internal Server Error" });
  }
};

export const verifyTokenController = (
  request: IJwtRequest,
  response: Response,
  next: NextFunction
) => {
  const { authorization: token } = request.cookies;
  try {
    if (!token)
      return response
        .status(401)
        .json({ status: 400, message: "Unauthorized" });
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET_KEY as string
    );
    request.payload = payload;
    next();
  } catch (error) {
    return response.status(400).json({ status: 401, messsage: "Unauthorized" });
  }
};

export const verifyOTP = async (
  request: Request<{}, {}, RequestBody>,
  response: Response<ResponseBody>
) => {
  const { otp } = request.body;
  try {
    if (!otp)
      return response
        .status(400)
        .json({ status: 400, message: "Please Provide The Otp" });
    const user = await User.findOne({ verificationToken: otp });
    if (!user)
      return response
        .status(400)
        .json({ message: "No User Match This OTP", status: 400 });
    if (user.isVerified)
      return response
        .status(400)
        .json({ status: 400, message: "User Already Verified" });
    if (<Date>user.verificationTokenExpirationTime > new Date()) {
      user.isVerified = true;
      const token = jwt.sign(
        { email: user.email },
        process.env.ACCESS_TOKEN_SECRET as string
      );
      response.cookie("ACCESS_TOKEN", token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
      });
      user.accessToken = token;
      await user.save();
      return response
        .status(200)
        .json({ message: "verified Succefuly", redirect: "/", status: 200 });
    }
    return response
      .status(400)
      .json({ message: "Verification Token Expired", status: 400 });
  } catch (error) {
    console.log(error);
    return response
      .status(500)
      .json({
        message: "Internal Server Error Please Try Again Later",
        status: 500,
      });
  }
};
