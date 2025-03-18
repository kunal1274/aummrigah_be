// models/User.js
import mongoose from "mongoose";
const { Schema, model } = mongoose;

const UserGlobalSchema = new Schema(
  {
    email: {
      type: String,
      required: function () {
        return !this.phoneNumber;
      },
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: function () {
        return !this.email;
      },
      unique: true,
      trim: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

export const UserGlobalModel =
  mongoose.models.UserGlobal || model("UserGlobal", UserGlobalSchema);
