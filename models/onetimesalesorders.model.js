import { Schema, model } from "mongoose";

const oneTimeCustomerSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: false,
  },
  mobile: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // Allows null values for unique fields
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  address: {
    type: String,
    required: false,
  },
});

oneTimeCustomerSchema.pre("save", async function (next) {
  if (this.isNew) {
    const sequence = await OneTimeCustomerCounterModel.findByIdAndUpdate(
      { _id: "oneTimeCustomerCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!sequence || sequence.seq === undefined) {
      return next(new Error("Failed to generate one-time customer code"));
    }

    this.code = `OneCust-${sequence.seq.toString().padStart(7, "0")}`;
  }
  next();
});

export const OneTimeCustomerModel = model(
  "OneTimeCustomer",
  oneTimeCustomerSchema
);
