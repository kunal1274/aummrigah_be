import mongoose, { model, Schema } from "mongoose";

// Define Schema
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

// Check if the model already exists before defining it
export const CustomerCounterModel =
  mongoose.models.CustomerCountersV1 ||
  model("CustomerCountersV1", customerCounterSchema);

const vendorCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const VendorCounterModel =
  mongoose.models.VendorCountersV1 ||
  model("VendorCountersV1", vendorCounterSchema);

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

export const ItemCounterModel =
  mongoose.models.ItemCountersV1 || model("ItemCountersV1", itemCounterSchema);

const ledgerAccountCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const LedgerAccountCounterModel =
  mongoose.models.LedgerAccountCountersV1 ||
  model("LedgerAccountCountersV1", ledgerAccountCounterSchema);

const ledgerMappingCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const LedgerMappingCounterModel =
  mongoose.models.LedgerMappingCountersV1 ||
  model("LedgerMappingCountersV1", ledgerMappingCounterSchema);

const bankCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const BankCounterModel =
  mongoose.models.BankCountersV1 || model("BankCountersV1", bankCounterSchema);

const taxCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const TaxCounterModel =
  mongoose.models.TaxCountersV1 || model("TaxCountersV1", taxCounterSchema);

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

export const SalesOrderCounterModel =
  mongoose.models.SalesOrderCountersV1 ||
  model("SalesOrderCountersV1", SalesOrderCounterSchema);

const purchaseOrderCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const PurchaseOrderCounterModel =
  mongoose.models.PurchaseOrderCountersV1 ||
  model("PurchaseOrderCountersV1", purchaseOrderCounterSchema);

const allocationCounterSchema = new Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export const AllocationCounterModel =
  mongoose.models.AllocationCountersV1 ||
  model("AllocationCountersV1", allocationCounterSchema);
