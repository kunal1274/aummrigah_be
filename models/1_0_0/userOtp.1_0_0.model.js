// models/Otp.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const OtpSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
      required: function () {
        return !this.email;
      },
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return !this.phoneNumber;
      },
      trim: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["whatsapp", "sms", "email"],
      required: true,
    },
    otpType: {
      type: String,
      enum: ["numeric", "alphanumeric", "alphanumeric_special"],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      //default: () => Date.now() + 10 * 60 * 1000, // OTP expires in 10 minutes
      default: () => Date.now() + 5 * 60 * 1000, // otp expires in 5 mins
    },
    createdAt: { type: Date, default: Date.now(), expires: 300 }, // Document expires after 120 seconds
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        // Remove __v if you wish
        //delete ret.__v;
        // Sort keys alphabetically for easier reading
        const sorted = {};
        Object.keys(ret)
          .sort()
          .forEach((key) => {
            sorted[key] = ret[key];
          });
        return sorted;
      },
    },
    toObject: { virtuals: true },
  }
);

OtpSchema.index({ email: 1 }, { unique: true });
OtpSchema.index({ phoneNumber: 1 }, { unique: true });
// module.exports = mongoose.model("Otp", OtpSchema);
export const UserOtpModel =
  mongoose.models.UserOtp || model("UserOtp", OtpSchema);
