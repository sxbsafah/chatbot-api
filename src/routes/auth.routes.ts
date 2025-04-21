import { Router } from "express";
import { loginController, registerController, verifyOTP } from "../controllers/authController";


const route = Router();

route.post("/login", loginController);
route.post("/register", registerController);
route.post("/verify",verifyOTP)
// route.post("/verify", verifyTokenController);


export default route;