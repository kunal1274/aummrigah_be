// controllers/authController.js

// controllers/authController.js (or user.1_0_0.controller.js)
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const googleAuthCallback = (req, res) => {
  // `req.user` is the user object from passport deserialize
  if (!req.user) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth/google/callback?error=NoUser`
    );
  }
  // Generate JWT
  const payload = {
    googleId: req.user.googleId,
    email: req.user.email,
  };
  //const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

  // Redirect to frontend with token as a query param
  const redirectUrl = `${
    process.env.FRONTEND_URL
  }/auth/google/callback?token=${token}&email=${encodeURIComponent(
    req.user.email
  )}`;
  res.redirect(redirectUrl);
};

export const googleAuthCallback1 = (req, res) => {
  // Successful authentication – you can redirect to your dashboard or send a JSON response.
  console.log("Successful google login is done for user", req.user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/google/callback`); // Change this route as needed.
};

export const googleAuthFailure = (req, res) => {
  res.status(401).json({ message: "Google authentication failed" });
};
