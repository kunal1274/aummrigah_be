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
  "CustomerCountersV2",
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

export const VendorCounterModel = model(
  "VendorCountersV2",
  vendorCounterSchema
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

export const ItemCounterModel = model("ItemCountersV2", itemCounterSchema);

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
  "LedgerAccountCountersV2",
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
  "LedgerMappingCountersV2",
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

export const BankCounterModel = model("BankCountersV2", bankCounterSchema);

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

export const TaxCounterModel = model("TaxCountersV2", taxCounterSchema);

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
  "SalesOrderCounterV2",
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
  "PurchaseOrderCounterV2",
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
  "AllocationCountersV2",
  allocationCounterSchema
);
