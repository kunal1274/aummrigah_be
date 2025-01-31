import mongoose from "mongoose";

const salesOrderEventLogSchema = new mongoose.Schema({
  salesOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "SalesOrders" },
  //changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  changedBy: { type: String, required: true },
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const SalesOrderEventLogModel = mongoose.model(
  "SalesOrderEventLogV2",
  salesOrderEventLogSchema
);
