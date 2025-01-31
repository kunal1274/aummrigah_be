import { Schema, model, mongoose } from "mongoose";
import { PurchaseOrderCounterModel } from "./counter.muuSHakaH.model.js";

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
    consumedQuantity: {
      type: Number,
      required: true,
      default: 0.0,
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
    // Tax and deduction fields
    tax: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    cgst: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    sgst: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    igst: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    vendorTDS: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    vendorTCS: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    vendorCommission: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    vendorCompanyCommission: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },

    // Computed fields
    totalReceivable: { type: Number, default: 0.0 },
    totalPayable: { type: Number, default: 0.0 },
    totalGovtPayable: { type: Number, default: 0.0 },
    totalGovtReceivable: { type: Number, default: 0.0 },
    totalCommissionPayable: { type: Number, default: 0.0 },
    totalCommissionReceivable: { type: Number, default: 0.0 },
    earningsAfterCommission: { type: Number, default: 0.0 },

    lineAmt: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // this should be a calculation like (qty*price) - discount + charges
      },
    },
    allocationId: {
      type: Schema.Types.ObjectId,
      ref: "Allocations",
      required: false,
    },
    soId: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrders",
      required: false,
    },
    // baseAmount: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return this.quantity * this.price + this.charges - this.discount;
    //   },
    // },
    // amtAfterTax: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return this.baseAmount + this.tax;
    //   },
    // },
    // commission: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return 0.2 * baseAmount;
    //   },
    // },
    // totalPayable: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return this.amtAfterTax - this.withholdingTax;
    //   },
    // },

    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "DRAFT",
          "CANCELLED",
          "CONFIRMED",
          "SHIPPED",
          "DELIVERED",
          "INVOICED",
          "ADMINMODE",
        ],
        message:
          "{VALUE} is not a valid status . Use  Case-sensitive among these only'DRAFT','CANCELLED','CONFIRMED','SHIPPED'.'DELIVERED','DELIVERED' or 'ADMINMODE'.",
      },
      default: "DRAFT",
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

    pickupLocation: { type: String, required: true, default: "Vendor Address" },
    pickupLocationCoordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, default: [0, 0] }, // [longitude, latitude]
    },
    destinationLocation: {
      type: String,
      required: true,
      default: "Vendor Final Destination",
    },
    destinationCoordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, default: [0, 0] },
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
    // statusHistory: [
    //   {
    //     oldStatus: { type: String, required: true },
    //     newStatus: { type: String, required: true },
    //     changedBy: { type: String, required: true, default: "AdminPurchase" }, // User or system
    //     reason: { type: String },
    //     timestamp: { type: Date, default: Date.now },
    //   },
    // ],
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
  },
  { timestamps: true }
);

// Pre-save hook to generate order number
purchaseOrderSchema1C1I.pre("save", async function (next) {
  const doc = this;

  if (
    doc.isModified("orderType") ||
    doc.isModified("quantity") ||
    doc.isModified("price") ||
    doc.isModified("charges") ||
    doc.isModified("discount") ||
    doc.isModified("tax") ||
    doc.isModified("cgst") ||
    doc.isModified("sgst") ||
    doc.isModified("igst") ||
    doc.isModified("vendorTCS") ||
    doc.isModified("vendorTDS") ||
    doc.isModified("vendorCommission") ||
    doc.isModified("vendorCompanyCommission")
  ) {
    const calculatedAmount = calculateAmounts({
      type: doc.orderType,
      qty: doc.quantity,
      price: doc.price,
      charges: doc.charges,
      discount: doc.discount,
      tax: doc.tax,
      cgst: doc.cgst,
      sgst: doc.sgst,
      igst: doc.igst,
      vendorTDS: doc.vendorTDS,
      vendorTCS: doc.vendorTCS,
      vendorCommission: doc.vendorCommission,
      vendorCompanyCommission: doc.vendorCompanyCommission,
    });

    doc.totalReceivable = calculatedAmount.vendor.totalReceivable;
    doc.totalPayable = calculatedAmount.vendor.totalPayable;
    doc.totalGovtPayable = calculatedAmount.vendor.totalGovtPayable;
    doc.totalGovtReceivable = calculatedAmount.vendor.totalGovtReceivable;
    doc.totalCommissionPayable = calculatedAmount.vendor.totalCommissionPayable;
    doc.totalCommissionReceivable =
      calculatedAmount.vendor.totalCommissionReceivable;
    doc.earningsAfterCommission =
      calculatedAmount.vendor.earningsAfterCommission;
  }

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
    "name price purchPrice salesPrice invPrice type unit"
  );
  next();
});

// Calculate Line Amount Automatically
purchaseOrderSchema1C1I.pre("validate", function (next) {
  this.lineAmt =
    this.quantity * this.price -
    this.discount +
    this.charges +
    this.tax -
    this.vendorTDS +
    this.vendorTCS;
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

const calculateAmounts = ({
  type,
  qty,
  price,
  charges = 0,
  discount = 0,
  tax = { amount: 0, rate: 0 },
  cgst = { amount: 0, rate: 0 },
  sgst = { amount: 0, rate: 0 },
  igst = { amount: 0, rate: 0 },
  vendorTDS = { amount: 0, rate: 0 },
  vendorTCS = { amount: 0, rate: 0 },
  vendorCommission = { amount: 0, rate: 0 },
  vendorCompanyCommission = { amount: 0, rate: 0 },
}) => {
  // Step 1: Base Amount Calculation
  const baseAmount = qty * price + charges - discount;

  // Step 2: Tax Calculations
  const calculatedTax = tax.amount || (tax.rate * baseAmount) / 100;
  const calculatedCGST = cgst.amount || (cgst.rate * baseAmount) / 100;
  const calculatedSGST = sgst.amount || (sgst.rate * baseAmount) / 100;
  const calculatedIGST = igst.amount || (igst.rate * baseAmount) / 100;

  const totalTax =
    calculatedTax || calculatedCGST + calculatedSGST + calculatedIGST;

  const amtAfterTax = baseAmount + totalTax;

  // Step 3: Customer TDS and TCS Calculations

  // Step 6: Vendor/Driver Commission
  const calculatedVendorCommission =
    vendorCommission.amount || (vendorCommission.rate * baseAmount) / 100;

  const calculatedVendorCompanyCommission =
    vendorCompanyCommission.amount ||
    (vendorCompanyCommission.rate * baseAmount) / 100;

  // Step 7: Driver TDS and TCS Calculations
  const calculatedVendorTDS =
    vendorTDS.amount || (vendorTDS.rate * baseAmount) / 100;
  const calculatedVendorTCS =
    vendorTCS.amount || (vendorTCS.rate * baseAmount) / 100;

  // Step 8: Final Amount earned from commission for the company
  const earningsAfterCommission =
    calculatedVendorCommission - calculatedVendorCompanyCommission;

  const calculatedTotal =
    amtAfterTax +
    calculatedVendorTCS +
    calculatedVendorCompanyCommission -
    calculatedVendorTDS -
    calculatedVendorCommission;

  // Step 5: Total Receivable from Customer

  const totalReceivable = type === "Purchase" ? 0 : calculatedTotal;
  const totalPayable = type === "Purchase" ? calculatedTotal : 0;
  const totalGovtPayable =
    type === "Purchase" ? calculatedVendorTDS : calculatedVendorTCS + totalTax;
  const totalGovtReceivable =
    type === "Purchase" ? calculatedVendorTCS + totalTax : calculatedVendorTDS;
  const totalCommissionReceivable =
    type === "Purchase"
      ? calculatedVendorCommission
      : calculatedVendorCompanyCommission;
  const totalCommissionPayable =
    type === "Purchase"
      ? calculatedVendorCompanyCommission
      : calculatedVendorCommission;

  return {
    vendor: {
      baseAmount,
      totalTax,
      amtAfterTax,
      vendorTDS: calculatedVendorTDS, // tds deducted at our end
      vendorTCS: calculatedVendorTCS, // tcs collected by vendor and thus added on our payables will be done by vendor
      vendorCommission: calculatedVendorCommission,
      vendorCompanyCommission: calculatedVendorCompanyCommission,
      earningsAfterCommission,
      totalReceivable,
      totalPayable, // will be used in case of return or refund.
      totalGovtPayable,
      totalGovtReceivable,
      totalCommissionPayable,
      totalCommissionReceivable,
    },
  };
};

purchaseOrderSchema1C1I.index({ orderNum: 1, vendor: 1, item: 1 });
purchaseOrderSchema1C1I.index({ orderNum: 1, allocationId: 1, soId: 1 });
purchaseOrderSchema1C1I.index({ orderNum: 1, soId: 1 });
purchaseOrderSchema1C1I.index({ orderNum: 1, allocationId: 1 });
purchaseOrderSchema1C1I.index({ pickupLocationCoordinates: "2dsphere" });
purchaseOrderSchema1C1I.index({ destinationCoordinates: "2dsphere" });

export const PurchaseOrderModel = model(
  "PurchaseOrdersV2",
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
