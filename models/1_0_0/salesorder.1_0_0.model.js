import mongoose, { Schema, model } from "mongoose";
import { SalesOrderCounterModel } from "./counter.1_0_0.model.js";

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
    discount: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    charges: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    tax: {
      type: Number,
      required: true,
      default: 0.0,
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
  this.populate(
    "customer",
    "code name contactNum address currency registrationNum panNum active"
  ).populate("item", "name price type unit");
  next();
});

// Calculate Line Amount Automatically
salesOrderSchema1C1I.pre("validate", function (next) {
  this.lineAmt = this.quantity * this.price - this.discount + this.charges;
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

salesOrderSchema1C1I.index({ orderNum: 1, customer: 1, item: 1 });

export const SalesOrderModel =
  mongoose.models.SalesOrdersV1 || model("SalesOrdersV1", salesOrderSchema1C1I);
