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

export const VendorCounterModel = model("VendorCounters", vendorCounterSchema);

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

export const LedgerAccountCounterModel = model(
  "LedgerAccountCounters",
  ledgerAccountCounterSchema
);

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

export const LedgerMappingCounterModel = model(
  "LedgerMappingCounters",
  ledgerMappingCounterSchema
);

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

export const BankCounterModel = model("BankCounters", bankCounterSchema);

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

export const TaxCounterModel = model("TaxCounters", taxCounterSchema);

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

export const PurchaseOrderCounterModel = model(
  "PurchaseOrderCounter",
  purchaseOrderCounterSchema
);

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

export const AllocationCounterModel = model(
  "AllocationCounters",
  allocationCounterSchema
);
