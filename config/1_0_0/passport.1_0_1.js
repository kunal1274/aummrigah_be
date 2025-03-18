// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { UserModel } from "../../models/1_0_0/user.2_0_0.model.js";

dotenv.config();

// Configure the Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find an existing user by Google ID
        let user = await UserModel.findOne({ googleId: profile.id });
        if (!user) {
          // If no user with this googleId, see if there's a user with the same email
          const existingEmailUser = await UserModel.findOne({
            email: profile.emails[0].value.toLowerCase(),
          });
          if (existingEmailUser) {
            // If that user has authMethod 'otp', we can unify => set googleId, authMethod = 'both'
            existingEmailUser.googleId = profile.id;
            existingEmailUser.authMethod =
              existingEmailUser.authMethod === "otp"
                ? "both"
                : existingEmailUser.authMethod;
            existingEmailUser.firstName = profile.name.givenName;
            existingEmailUser.lastName = profile.name.familyName;
            existingEmailUser.displayName = profile.displayName;
            existingEmailUser.image = profile.photos[0].value;
            user = await existingEmailUser.save();
          } else {
            // Create a new user
            user = await UserModel.create({
              googleId: profile.id,
              email: profile.emails[0].value.toLowerCase(),
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              displayName: profile.displayName,
              image: profile.photos[0].value,
              authMethod: "google",
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user ID to store in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize the user from the session by ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
