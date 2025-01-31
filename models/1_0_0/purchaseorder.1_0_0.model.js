import mongoose, { Schema, model } from "mongoose";
import { PurchaseOrderCounterModel } from "./counter.1_0_0.model.js";

// Purchase Order Schema
const purchaseOrderSchema1C1I = new Schema(
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
        values: ["Purchase", "Return"],
        message:
          "{VALUE} is not a valid order type. Use case-sensitive value among these only 'Purchase','Return'.",
      },
      default: "Purchase",
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendors", // Reference to the Vendor model
      required: true,
    },

    item: {
      type: Schema.Types.ObjectId,
      ref: "Items", // Reference to the Item model
      required: true,
    },
    purchaseAddress: {
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
    netAP: {
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
          "InboundTransit",
          "Received",
          "Invoiced",
          "AdminMode",
          "Cancelled",
        ],
        message:
          "{VALUE} is not a valid status . Use  Case-sensitive among these only'DRAFT','CANCELLED','CONFIRMED','SHIPPED'.'DELIVERED','DELIVERED' or 'ADMINMODE'.",
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
      default: "SystemPOCreation",
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
purchaseOrderSchema1C1I.pre("save", async function (next) {
  const doc = this;

  if (!doc.isNew) {
    return next();
  }

  try {
    // Populate salesAddress and currency from customer's address and currency if not already set
    if (!doc.purchaseAddress || !doc.currency) {
      // Fetch the customer document to get the address and currency
      const vendor = await mongoose
        .model("Vendors")
        .findById(doc.vendor)
        .select("address currency");

      if (!vendor) {
        throw new Error(`Vendor with ID ${doc.vendor} not found.`);
      }

      if (!vendor.address) {
        throw new Error(
          `Vendor with ID ${doc.vendor} does not have an address.`
        );
      }

      if (!vendor.currency) {
        throw new Error(
          `Vendor with ID ${doc.vendor} does not have a currency set.`
        );
      }

      if (!doc.purchaseAddress) {
        doc.purchaseAddress = vendor.address;
      }

      if (!doc.currency) {
        doc.currency = vendor.currency;
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
    const netAP = Math.round((netAmtAfterTax - withholdingTaxAmt) * 100) / 100;

    doc.discountAmt = discountAmt;
    doc.taxAmount = taxAmount;
    doc.withholdingTaxAmt = withholdingTaxAmt;
    doc.netAmtAfterTax = netAmtAfterTax;
    doc.netAP = netAP;

    await doc.validate();

    const dbResponse = await PurchaseOrderCounterModel.findByIdAndUpdate(
      { _id: "purchaseOrderCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log("Counter increment result", dbResponse);

    if (!dbResponse || dbResponse.seq === undefined) {
      throw new Error("Failed to generate purchase order number");
    }

    const seqNumber = dbResponse.seq.toString().padStart(6, "0");
    doc.orderNum = `PO_${seqNumber}`;

    next();
  } catch (error) {
    console.log("Error caught during SO presave", error.stack);
    next(error);
  }
});

// Populate References on Find

purchaseOrderSchema1C1I.pre(/^find/, function (next) {
  this.populate(
    "vendor",
    "code name contactNum address currency registrationNum panNum active"
  ).populate("item", "name price type unit");
  next();
});

// Calculate Line Amount Automatically
purchaseOrderSchema1C1I.pre("validate", function (next) {
  const initialAmt = this.quantity * this.price;
  const discountAmt = Math.round(this.discount * initialAmt) / 100;
  this.lineAmt = this.quantity * this.price - discountAmt + this.charges;
  next();
});

purchaseOrderSchema1C1I.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  try {
    // Validate existence of the vendor
    if (update.vendor) {
      const vendorExists = await mongoose
        .model("Vendors")
        .findById(update.vendor);
      if (!vendorExists) {
        throw new Error(`Vendor with ID ${update.vendor} does not exist.`);
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

    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/controller
  }
});

purchaseOrderSchema1C1I.index({ orderNum: 1, vendor: 1, item: 1 });

export const PurchaseOrderModel =
  mongoose.models.PurchaseOrders ||
  model("PurchaseOrders", purchaseOrderSchema1C1I);
