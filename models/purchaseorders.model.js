import { Schema, model, mongoose } from "mongoose";
import { PurchaseOrderCounterModel } from "./counter.model.js";

// Purchase Order Schema
const purchaseOrderSchema1C1I = new Schema(
  {
    orderNum: {
      type: String,
      required: false,
      unique: true,
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
      enum: {
        values: [
          "Draft",
          "Cancelled",
          "Confirmed",
          "Shipped",
          "Delivered",
          "Invoiced",
        ],
        message:
          "{VALUE} is not a valid status . Use among these only'Draft','Cancelled','Confirmed','Shipped'.'Delivered','Invoiced'.",
      },
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
purchaseOrderSchema1C1I.pre("save", async function (next) {
  const doc = this;

  if (!doc.isNew) {
    return next();
  }

  try {
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
  this.populate("vendor", "name contactNum").populate(
    "item",
    "name price type unit"
  );
  next();
});

// Calculate Line Amount Automatically
purchaseOrderSchema1C1I.pre("validate", function (next) {
  this.lineAmt = this.quantity * this.price - this.discount + this.charges;
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

    // Recalculate line amount if relevant fields are being updated
    if (update.quantity || update.price || update.discount || update.charges) {
      const quantity = update.quantity || this.getQuery().quantity || 1;
      const price = update.price || this.getQuery().price || 0;
      const discount = update.discount || this.getQuery().discount || 0;
      const charges = update.charges || this.getQuery().charges || 0;

      update.lineAmt = quantity * price - discount + charges;
      this.setUpdate(update);
    }

    next();
  } catch (error) {
    next(error); // Pass error to the next middleware/controller
  }
});

purchaseOrderSchema1C1I.index({ orderNum: 1, vendor: 1, item: 1 });

export const PurchaseOrderModel = model(
  "PurchaseOrder",
  purchaseOrderSchema1C1I
);

/*
// Purchase Order Schema with multiple items
const purchaseOrderSchemaV2 = new Schema(
  {
    orderNum: {
      type: String,
      required: true,
      unique: true,
    },
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
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
purchaseOrderSchemaV2.pre("save", async function (next) {
  const doc = this;

  try {
    const dbResponse = await PurchaseOrderCounterModel.findByIdAndUpdate(
      { _id: "purchaseOrderCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!dbResponse || dbResponse.seq === undefined) {
      throw new Error("Failed to generate purchase order number");
    }

    const seqNumber = dbResponse.seq.toString().padStart(6, "0");
    doc.orderNum = `SO_${seqNumber}`;

    next();
  } catch (error) {
    next(error);
  }
});

export const PurchaseOrderModelV2 = model("PurchaseOrderV2", purchaseOrderSchemaV2);
*/
