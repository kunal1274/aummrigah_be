// routes/authRoutes.js
import express from "express";
import {
  sendOtp,
  verifyOtp,
} from "../../controllers/1_0_0/userOtp.1_0_0.controller.js";
import { authenticateJWT } from "../../middleware/1_0_0/authJwtHandler.1_0_0.mw.js";

const authRouter = express.Router();

// Route to send OTP
authRouter.post("/send-otp", sendOtp);

// Route to verify OTP
authRouter.post("/verify-otp", verifyOtp);

// Validate token route
authRouter.get("/me", authenticateJWT, (req, res) => {
  // If token is valid, req.user is set by the authenticateJWT middleware
  // Return user info or a success message
  res.status(200).json({ msg: "Token is valid", user: req.user });
});

export default authRouter;
