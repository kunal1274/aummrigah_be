import mongoose, { Schema, model } from "mongoose";
import { SalesOrderCounterModel } from "./counter.1_0_0.model.js";

// Define allowed status transitions
const STATUS_TRANSITIONS = {
  Draft: ["Confirmed", "Cancelled", "AdminMode", "AnyMode"],
  Confirmed: ["Shipped", "Cancelled", "AdminMode", "AnyMode"],
  Shipped: ["Delivered", "Cancelled", "AdminMode", "AnyMode"],
  Delivered: ["Invoiced", "AdminMode", "AnyMode"],
  Invoiced: ["AdminMode", "AnyMode"],
  Cancelled: ["AdminMode", "AnyMode"],
  AdminMode: ["Draft", "AnyMode"],
  AnyMode: [
    "Draft",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Invoiced",
    "Cancelled",
    "AdminMode",
  ],
};

// Sales Order Schema
const salesOrderSchema1C1I = new Schema(
  {
    orderNum: {
      type: String,
      required: false,
      unique: true,
    },
    orderType: {
      type: String,
      required: true,
      enum: {
        values: ["Sales", "Return"],
        message:
          "{VALUE} is not a valid order type. Use case-sensitive value among these only 'Purchase','Return'.",
      },
      default: "Sales",
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
    salesAddress: {
      type: String, // Adjust the type if address is more complex
      required: false, // Ensures that salesAddress is always set
    },
    advance: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
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
    currency: {
      type: String,
      required: true,
      enum: {
        values: ["INR", "USD", "EUR", "GBP"],
        message:
          "{VALUE} is not a valid currency. Use among these only'INR','USD','EUR','GBP'.",
      },
      default: "INR",
    },

    charges: {
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
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    tax: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Tax cannot be negative"],
      max: [100, "Tax cannot exceed 100%"],
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    withholdingTax: {
      type: Number,
      required: true,
      default: 0.0,
      min: [0, "Withholding Tax cannot be negative"],
      max: [100, "Withholding Tax cannot exceed 100%"],
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },

    lineAmt: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // this should be a calculation like (qty*price) - discount + charges
      },
    },
    // Computed Fields
    taxAmount: {
      type: Number,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    discountAmt: {
      type: Number,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    withholdingTaxAmt: {
      type: Number,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    netAmtAfterTax: {
      type: Number,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    netAR: {
      type: Number,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "Draft",
          "Approved",
          "Confirmed",
          "Shipped", // Outbound Transit
          "Delivered",
          "Invoiced",
          "Cancelled",
          "AdminMode",
          "AnyMode",
        ],
        message:
          "{VALUE} is not a valid status . Use among these only'Draft','Cancelled','Confirmed','Shipped'.'Delivered','Invoiced','AdminMode','AnyMode'.",
      },
      default: "Draft",
    },
    settlementStatus: {
      type: String,
      required: true,
      enum: {
        values: [
          "PAYMENT_PENDING",
          "PAYMENT_PARTIAL",
          "PAYMENT_FULL",
          "PAYMENT_FAILED",
        ],
        message:
          "{VALUE} is not a valid status .Use  Case-sensitive among these only'PAYMENT_PENDING','PAYMENT_PARTIAL','PAYMENT_FULL','PAYMENT_FAILED'.",
      },
      default: "PAYMENT_PENDING",
    },
    archived: { type: Boolean, default: false }, // New field
    createdBy: {
      type: String,
      required: true,
      default: "SystemSOCreation",
    },
    updatedBy: {
      type: String,
      default: null,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    // New field for file uploads
    files: [
      {
        fileName: { type: String, required: true }, // Name of the file
        fileType: { type: String, required: true }, // MIME type (e.g., "application/pdf", "image/png")
        fileUrl: { type: String, required: true }, // URL/path of the uploaded file
        uploadedAt: { type: Date, default: Date.now }, // Timestamp for the upload
      },
    ],
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
    // Populate salesAddress and currency from customer's address and currency if not already set
    if (!doc.salesAddress || !doc.currency) {
      // Fetch the customer document to get the address and currency
      const customer = await mongoose
        .model("Customers")
        .findById(doc.customer)
        .select("address currency");

      if (!customer) {
        throw new Error(`Customer with ID ${doc.customer} not found.`);
      }

      if (!customer.address) {
        throw new Error(
          `Customer with ID ${doc.customer} does not have an address.`
        );
      }

      if (!customer.currency) {
        throw new Error(
          `Customer with ID ${doc.customer} does not have a currency set.`
        );
      }

      if (!doc.salesAddress) {
        doc.salesAddress = customer.address;
      }

      if (!doc.currency) {
        doc.currency = customer.currency;
      }
    }

    // Calculate Computed Fields
    const initialAmt = doc.quantity * doc.price;
    const discountAmt =
      Math.round(((doc.discount * initialAmt) / 100) * 100) / 100;
    const taxAmount =
      Math.round(
        ((doc.tax * (doc.quantity * doc.price - discountAmt + doc.charges)) /
          100) *
          100
      ) / 100;
    const withholdingTaxAmt =
      Math.round(
        ((doc.withholdingTax *
          (doc.quantity * doc.price - discountAmt + doc.charges)) /
          100) *
          100
      ) / 100;
    const netAmtAfterTax =
      Math.round(
        (doc.quantity * doc.price - discountAmt + doc.charges + taxAmount) * 100
      ) / 100;
    const netAR = Math.round((netAmtAfterTax + withholdingTaxAmt) * 100) / 100;

    doc.discountAmt = discountAmt;
    doc.taxAmount = taxAmount;
    doc.withholdingTaxAmt = withholdingTaxAmt;
    doc.netAmtAfterTax = netAmtAfterTax;
    doc.netAR = netAR;

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
  this.populate(
    "customer",
    "code name contactNum address currency registrationNum panNum active"
  ).populate("item", "name price type unit");
  next();
});

// Calculate Line Amount Automatically
salesOrderSchema1C1I.pre("validate", function (next) {
  const initialAmt = this.quantity * this.price;
  const discountAmt = Math.round(this.discount * initialAmt) / 100;
  this.lineAmt = this.quantity * this.price - discountAmt + this.charges;
  next();
});

salesOrderSchema1C1I.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  try {
    // Validate existence of the customer
    if (update.customer) {
      const customerExists = await mongoose
        .model("Customers")
        .findById(update.customer);
      if (!customerExists) {
        throw new Error(`Customer with ID ${update.customer} does not exist.`);
      }
    }

    // Validate existence of the item
    if (update.item) {
      const itemExists = await mongoose.model("Items").findById(update.item);
      if (!itemExists) {
        throw new Error(`Item with ID ${update.item} does not exist.`);
      }
    }

    // Recalculate computed fields if relevant fields are being updated
    if (
      update.quantity ||
      update.price ||
      update.discount ||
      update.charges ||
      update.tax ||
      update.withholdingTax
    ) {
      // Fetch the existing document to get current values if not provided in the update
      const docToUpdate = await this.model.findOne(this.getQuery());

      const quantity = update.quantity || docToUpdate.quantity || 1;
      const price = update.price || docToUpdate.price || 0;
      const discount = update.discount || docToUpdate.discount || 0;
      const charges = update.charges || docToUpdate.charges || 0;
      const tax = update.tax || docToUpdate.tax || 0;
      const withholdingTax =
        update.withholdingTax || docToUpdate.withholdingTax || 0;

      const initialAmt = quantity * price;
      const discountAmt =
        Math.round(((discount * initialAmt) / 100) * 100) / 100;
      const lineAmt =
        Math.round((quantity * price - discountAmt + charges) * 100) / 100;
      const taxAmount = Math.round(((tax * lineAmt) / 100) * 100) / 100;
      const withholdingTaxAmt =
        Math.round(((withholdingTax * lineAmt) / 100) * 100) / 100;
      const netAmtAfterTax = Math.round((lineAmt + taxAmount) * 100) / 100;
      const netAR =
        Math.round(
          (netAmtAfterTax + (withholdingTax * initialAmt) / 100) * 100
        ) / 100;

      update.lineAmt = lineAmt;
      update.discountAmt = discountAmt;
      update.taxAmount = taxAmount;
      update.withholdingTaxAmt = withholdingTaxAmt;
      update.netAmtAfterTax = netAmtAfterTax;
      update.netAR = netAR;
    }

    // Handle status reversion to Draft on modifications
    const fieldsBeingUpdated = [
      "orderType",
      "customer",
      "item",
      "salesAddress",
      "advance",
      "quantity",
      "price",
      "currency",
      "discount",
      "charges",
      "tax",
      "withholdingTax",
      "settlementStatus",
      "archived",
      "createdBy",
      "updatedBy",
      "active",
      "files",
    ];

    const isModifying = fieldsBeingUpdated.some((field) => field in update);

    if (isModifying) {
      // Set status back to Draft
      update.status = "Draft";
    }

    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/controller
  }
});

salesOrderSchema1C1I.index({ orderNum: 1, customer: 1, item: 1 });

export const SalesOrderModel =
  mongoose.models.SalesOrders || model("SalesOrders", salesOrderSchema1C1I);
