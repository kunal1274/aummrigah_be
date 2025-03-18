// models/User.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserSchema = new Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    }, // "sparse: true" means it's allowed to be null or missing for OTP-based users
    displayName: {
      type: String,
      required: true,
      sparse: true,
    },
    firstName: String,
    lastName: String,
    email: {
      type: String,
      required: function () {
        return !this.phoneNumber;
      },
      unique: true,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    image: String,
    phoneNumber: {
      type: String,
      required: function () {
        return !this.email;
      },
      trim: true,
    },
    // email: {
    //   type: String,
    //   required: function () {
    //     return !this.phoneNumber;
    //   },
    //   trim: true,
    //   lowercase: true,
    // },
    otp: {
      type: String,
      required: true,
      sparse: true,
    },
    method: {
      type: String,
      enum: ["whatsapp", "sms", "email"],
      required: true,
      default: "email",
    },
    otpType: {
      type: String,
      enum: ["numeric", "alphanumeric", "alphanumeric_special"],
      required: true,
      default: "numeric",
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
    },
    // E.g. "otp" or "google" or "both"
    authMethod: {
      type: String,
      enum: ["otp", "google", "both"],
      default: "otp",
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || model("User", UserSchema);
