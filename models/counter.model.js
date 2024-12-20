import { model, Schema } from "mongoose";

// Original Version
const customerCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const itemCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const CustomerCounterModel = model(
  "CustomerCounters",
  customerCounterSchema
);

export const ItemCounterModel = model("ItemCounters", itemCounterSchema);
