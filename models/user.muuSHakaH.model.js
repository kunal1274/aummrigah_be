import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    name: {
      type: String,
      required: false,
      default: "System",
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model("Users", userSchema);
