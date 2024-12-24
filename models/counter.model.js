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

export const CustomerCounterModel = model(
  "CustomerCounters",
  customerCounterSchema
);

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

export const ItemCounterModel = model("ItemCounters", itemCounterSchema);

const SalesOrderCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const SalesOrderCounterModel = model(
  "SalesOrderCounter",
  SalesOrderCounterSchema
);
