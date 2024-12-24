import { Schema, model } from "mongoose";
import { SalesOrderCounterModel } from "./counter.model.js";

// Sales Order Schema
const salesOrderSchema1C1I = new Schema(
  {
    orderNum: {
      type: String,
      required: false,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customers", // Reference to the Customer model
      required: true,
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Items", // Reference to the Item model
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // round off during save
      },
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    discount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    charges: {
      type: Number,
      required: true,
      default: 0.0,
    },
    lineAmt: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // this should be a calculation like (qty*price) - discount + charges
      },
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Draft",
        "Cancelled",
        "Confirmed",
        "Shipped",
        "Delivered",
        "Invoiced",
      ],
      default: "Draft",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate order number
salesOrderSchema1C1I.pre("save", async function (next) {
  const doc = this;

  if (!doc.isNew) {
    return next();
  }

  try {
    await doc.validate();

    const dbResponse = await SalesOrderCounterModel.findByIdAndUpdate(
      { _id: "salesOrderCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log("Counter increment result", dbResponse);

    if (!dbResponse || dbResponse.seq === undefined) {
      throw new Error("Failed to generate sales order number");
    }

    const seqNumber = dbResponse.seq.toString().padStart(6, "0");
    doc.orderNum = `SO_${seqNumber}`;

    next();
  } catch (error) {
    console.log("Error caught during SO presave", error.stack);
    next(error);
  }
});

// Populate References on Find
salesOrderSchema1C1I.pre(/^find/, function (next) {
  this.populate("customer", "name contactNum").populate(
    "item",
    "name price type unit"
  );
  next();
});

// Calculate Line Amount Automatically
salesOrderSchema1C1I.pre("validate", function (next) {
  this.lineAmt = this.quantity * this.price - this.discount + this.charges;
  next();
});

salesOrderSchema1C1I.index({ orderNum: 1, customer: 1, item: 1 });

export const SalesOrderModel = model("SalesOrder", salesOrderSchema1C1I);

// Sales Order Schema with multiple items
const salesOrderSchemaV2 = new Schema(
  {
    orderNum: {
      type: String,
      required: true,
      unique: true,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [
      {
        item: {
          type: Schema.Types.ObjectId,
          ref: "Items",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate order number
salesOrderSchemaV2.pre("save", async function (next) {
  const doc = this;

  try {
    const dbResponse = await SalesOrderCounterModel.findByIdAndUpdate(
      { _id: "salesOrderCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!dbResponse || dbResponse.seq === undefined) {
      throw new Error("Failed to generate sales order number");
    }

    const seqNumber = dbResponse.seq.toString().padStart(6, "0");
    doc.orderNum = `SO_${seqNumber}`;

    next();
  } catch (error) {
    next(error);
  }
});

export const SalesOrderModelV2 = model("SalesOrderV2", salesOrderSchemaV2);
