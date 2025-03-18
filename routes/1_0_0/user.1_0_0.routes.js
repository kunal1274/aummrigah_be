// routes/authRoutes.js
import express from "express";
import passport from "../../config/1_0_0/passport.js";
import {
  googleAuthCallback,
  googleAuthFailure,
} from "../../controllers/1_0_0/user.1_0_0.controller.js";

const googleAuthRouter = express.Router();

// Route to start Google authentication. Request profile and email scopes.
googleAuthRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route that Google will redirect to after authentication.
googleAuthRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/google/failure",
  }),
  googleAuthCallback
);

// Failure route
googleAuthRouter.get("/google/failure", googleAuthFailure);

export default googleAuthRouter;
