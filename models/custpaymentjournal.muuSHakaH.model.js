import { Schema, model, mongoose } from "mongoose";
import { SalesOrderCounterModel } from "./counter.muuSHakaH.model.js";

// Sales Order Schema
const custPaymentJournalSingleLine = new Schema(
  {
    journalNum: {
      type: String,
      required: false,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ["Receipt", "Refund", "Advance"],
        message:
          "{VALUE} is not a valid type. Use 'Receipt' or 'Refund' or 'Advance'.",
      },
      default: "Receipt",
    },
    allocationId: {
      type: Schema.Types.ObjectId,
      ref: "Allocations",
      required: false,
    },
    poId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrders",
      required: false,
    },
    soId: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrders",
      required: false,
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customers", // Reference to the Customer model
      required: true,
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
    paymentAmount: {
      type: Number,
      required: true,
      default: 0.0, // positive means credit and negative means debit the customer
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "PAYMENT_PENDING",
          "PAYMENT_INITIATED",
          "PAYMENT_PROCESSING",
          "PAYMENT_SUCCESS",
          "PAYMENT_FAILED",
          //   "REFUND_INITIATED",
          //   "REFUND_PROCESSING",
          //   "REFUND_SUCCESS",
          //   "REFUND_FAILED",
        ],
        message:
          "{VALUE} is not a valid status . Use among these only'PAYMENT_INITIATED','PAYMENT_PROCESSING','PAYMENT_SUCCESS','PAYMENT_FAILED'.",
      },
      default: "PAYMENT_INITIATED",
    },
    paymentMethod: {
      type: String,
      enum: [
        "CREDIT_CARD",
        "DEBIT_CARD",
        "UPI",
        "CASH",
        "NETBANKING",
        "WALLET",
      ],
      required: true,
      default: "UPI",
    },
    offsetEntry: {
      type: Schema.Types.ObjectId,
      ref: "Banks", // Reference to the Customer model
      required: true,
    },
    // offsetEntryType: {
    //   type: String,
    //   required: true,
    //   enum: {
    //     values: ["Bank", "Ledger", "Vendor", "Customer", "Item",],
    //     message:
    //       "{VALUE} is not a valid unit . Use among these only'ea','qty','mt','kgs'.'lbs',hrs','mins'.",
    //   },
    //   default: "mt",
    // },
    active: {
      type: Boolean,
      required: true,
      default: false,
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
    archived: { type: Boolean, default: false }, // New field
    // statusHistory: [
    //   {
    //     oldStatus: { type: String, required: true },
    //     newStatus: { type: String, required: true },
    //     changedBy: { type: String, required: true, default: "AdminSales" }, // User or system
    //     reason: { type: String },
    //     timestamp: { type: Date, default: Date.now },
    //   },
    // ],
    // changeHistory: [
    //   {
    //     field: { type: String, required: true }, // Field name that changed
    //     oldValue: { type: mongoose.Schema.Types.Mixed, required: true }, // Old value
    //     newValue: { type: mongoose.Schema.Types.Mixed, required: true }, // New value
    //     changedBy: { type: String, required: true }, // User or system making the change
    //     reason: { type: String, required: false }, // Optional reason for the change
    //     timestamp: { type: Date, default: Date.now }, // Time of change
    //   },
    // ],
  },
  { timestamps: true }
);

salesOrderSchema1C1I.set("toJSON", { getters: true });
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
    "name price purchPrice salesPrice invPrice type unit"
  );
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

export const SalesOrderModel = model("SalesOrders", salesOrderSchema1C1I);
