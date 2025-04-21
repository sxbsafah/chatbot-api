import Router, { RequestHandler } from "express";
import { verifyTokenController } from "../controllers/authController";

const router = Router();

router.use(verifyTokenController as RequestHandler);

router.get("/rooms",)