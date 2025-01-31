import { Schema, model, mongoose } from "mongoose";
import { SalesOrderCounterModel } from "./counter.muuSHakaH.model.js";
import axios from "axios";

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
          "{VALUE} is not a valid order type. Use case-sensitive value among these only 'Sales','Return'.",
      },
      default: "Sales",
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
    releasedQuantity: {
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
    customerTDS: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    customerTCS: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    customerCommission: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },
    companyCommission: {
      amount: { type: Number, default: 0 },
      rate: { type: Number, default: 0 },
    },

    // Computed fields
    baseAmount: { type: Number, default: 0.0 },
    totalTax: { type: Number, default: 0.0 },
    totalAfterTax: { type: Number, default: 0.0 },
    totalWithholdingTaxTDS: { type: Number, default: 0.0 },
    totalWithholdingTaxTCS: { type: Number, default: 0.0 },
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
    poId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrders",
      required: false,
    },

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
          "{VALUE} is not a valid status . Use Case-sensitive among these only'DRAFT','CANCELLED','CONFIRMED','SHIPPED'.'DELIVERED','DELIVERED' or 'ADMINMODE'.",
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
          "ADMIN_MODE",
        ],
        message:
          "{VALUE} is not a valid status .Use  Case-sensitive among these only'PAYMENT_PENDING','PAYMENT_PARTIAL','PAYMENT_FULL','PAYMENT_FAILED'.",
      },
      default: "PAYMENT_PENDING",
    },

    pickupLocation: {
      type: String,
      required: true,
      default: "DMart, Sector 70A, Gurugram, Haryana 122101",
    },
    pickupLocationCoordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, default: [0, 0] }, // [longitude, latitude]
    },
    destinationLocation: {
      type: String,
      required: true,
      default: "Customer Final Destination",
    },
    destinationCoordinates: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true, default: [0, 0] },
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
    // baseAmount: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return (
    //       Math.round(
    //         (this.quantity * this.price + this.charges - this.discount) * 100
    //       ) / 100
    //     );
    //   },
    // },
    // amtAfterTax: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return Math.round((this.baseAmount + this.tax) * 100) / 100;
    //   },
    // },
    // totalReceivable: {
    //   type: Number,
    //   required: true,
    //   default: function () {
    //     return Math.round((this.amtAfterTax + this.withholdingTax) * 100) / 100;
    //   },
    // },
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
    doc.isModified("customerTCS") ||
    doc.isModified("customerTDS") ||
    doc.isModified("customerCommission") ||
    doc.isModified("companyCommission")
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
      customerTDS: doc.customerTDS,
      customerTCS: doc.customerTCS,
      customerCommission: doc.customerCommission,
      companyCommission: doc.companyCommission,
    });

    doc.baseAmount = calculatedAmount.customer.baseAmount;
    doc.totalTax = calculatedAmount.customer.totalTax;
    doc.totalAfterTax = calculatedAmount.customer.amtAfterTax;
    doc.totalWithholdingTaxTDS = calculatedAmount.customer.customerTDS;
    doc.totalWithholdingTaxTCS = calculatedAmount.customer.customerTCS;
    doc.totalReceivable = calculatedAmount.customer.totalReceivable;
    doc.totalPayable = calculatedAmount.customer.totalPayable;
    doc.totalGovtPayable = calculatedAmount.customer.totalGovtPayable;
    doc.totalGovtReceivable = calculatedAmount.customer.totalGovtReceivable;
    doc.totalCommissionPayable =
      calculatedAmount.customer.totalCommissionPayable;
    doc.totalCommissionReceivable =
      calculatedAmount.customer.totalCommissionReceivable;
    doc.earningsAfterCommission =
      calculatedAmount.customer.earningsAfterCommission;
  }

  if (!doc.isNew && !doc.isModified("pickupLocation")) {
    // If not a new document and pickupLocation is not modified, skip geocoding
    return next();
  }

  try {
    // Step 1: Validate and Generate Order Number
    if (doc.isNew) {
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
    }

    // Step 2: Fetch Geolocation for Pickup Location
    if (doc.pickupLocation) {
      const apiKey = "AIzaSyAyPn2j-knCACTYr1oBdFARHqoOthWDvW8"; // Replace with your API key
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: doc.pickupLocation,
            key: apiKey,
          },
        }
      );

      const { data } = response;
      if (data.status === "OK" && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        doc.pickupLocationCoordinates = {
          type: "Point",
          coordinates: [lng, lat], // GeoJSON format [longitude, latitude]
        };
      } else {
        throw new Error(`Unable to fetch coordinates for the location.`);
      }
    } else {
      // If no pickup location, reset coordinates
      doc.pickupLocationCoordinates = { type: "Point", coordinates: [0, 0] };
    }

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
  this.lineAmt =
    this.quantity * this.price -
    this.discount +
    this.charges +
    this.tax.amount +
    this.customerTCS.amount -
    this.customerTDS.amount;
  console.log(this.lineAmt);
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
  customerTDS = { amount: 0, rate: 0 },
  customerTCS = { amount: 0, rate: 0 },
  customerCommission = { amount: 0, rate: 0 },
  companyCommission = { amount: 0, rate: 0 },
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
  const calculatedCustomerTDS = // this will be deducted by customer at their end
    customerTDS.amount || (customerTDS.rate * amtAfterTax) / 100;
  const calculatedCustomerTCS = // this will be added by us on the customer
    customerTCS.amount || (customerTCS.rate * amtAfterTax) / 100;

  // Step 4: Customer Commission
  const calculatedCustomerCommission = // this is a commission a customer will take on behalf of providing us an opportunity to work with them
    customerCommission.amount || (customerCommission.rate * baseAmount) / 100;

  const calculatedCompanyCommission = // this is a commission company takes from customer on providing some service like insurance etc.
    companyCommission.amount || (companyCommission.rate * baseAmount) / 100;

  const earningsAfterCommission =
    calculatedCompanyCommission - calculatedCustomerCommission;
  // Step 5: Total Receivable from Customer
  const calculatedTotal =
    amtAfterTax +
    calculatedCustomerTCS +
    calculatedCompanyCommission -
    calculatedCustomerTDS -
    calculatedCustomerCommission;

  const totalReceivable = type === "Sales" ? calculatedTotal : 0;
  const totalPayable = type === "Sales" ? 0 : calculatedTotal;
  const totalGovtPayable =
    type === "Sales" ? calculatedCustomerTCS + totalTax : calculatedCustomerTDS;
  const totalGovtReceivable =
    type === "Sales" ? calculatedCustomerTDS : calculatedCustomerTCS + totalTax;
  const totalCommissionReceivable =
    type === "Sales"
      ? calculatedCompanyCommission
      : calculatedCustomerCommission;
  const totalCommissionPayable =
    type === "Sales"
      ? calculatedCustomerCommission
      : calculatedCompanyCommission;

  return {
    customer: {
      baseAmount,
      totalTax,
      amtAfterTax,
      customerTDS: calculatedCustomerTDS,
      customerTCS: calculatedCustomerTCS,
      customerCommission: calculatedCustomerCommission,
      companyCommission: calculatedCompanyCommission,
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

salesOrderSchema1C1I.index({ orderNum: 1, customer: 1, item: 1 });
salesOrderSchema1C1I.index({ orderNum: 1, allocationId: 1, poId: 1 });
salesOrderSchema1C1I.index({ orderNum: 1, poId: 1 });
salesOrderSchema1C1I.index({ orderNum: 1, allocationId: 1 });
salesOrderSchema1C1I.index({ pickupLocationCoordinates: "2dsphere" });
salesOrderSchema1C1I.index({ destinationCoordinates: "2dsphere" });

export const SalesOrderModel = model("SalesOrders", salesOrderSchema1C1I);

const salesOrderSchemaFuture = new mongoose.Schema(
  {
    orderNum: { type: String, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customers", required: true },
    //item: { type: Schema.Types.ObjectId, ref: "Items", required: true },
    item: [
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
        totalAmt: {
          type: Number,
          required: true,
        },
      },
    ],
    quantity: { type: Number, default: 1.0 },
    price: { type: Number, default: 0.0 },
    charges: { type: Number, default: 0.0 },
    discount: { type: Number, default: 0.0 },

    // Dynamic fields for customer
    customerTaxes: [
      {
        name: { type: String, required: true }, // e.g., "CGST", "SGST", "IGST"
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    customerDeductions: [
      {
        name: { type: String, required: true }, // e.g., "TDS", "Commission"
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],

    // Dynamic fields for vendor
    vendorTaxes: [
      {
        name: { type: String, required: true }, // e.g., "CGST", "SGST", "IGST"
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    vendorDeductions: [
      {
        name: { type: String, required: true }, // e.g., "TDS", "Commission"
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
    ],
    linkedParentSOId: [
      {
        type: Schema.Types.ObjectId,
        ref: "SalesOrders",
        required: false,
      },
    ],
    linkedChildrenSOId: [
      {
        type: Schema.Types.ObjectId,
        ref: "SalesOrders",
        required: false,
      },
    ],

    // Computed fields
    totalReceivable: { type: Number, default: 0.0 },
    vendorReceivable: { type: Number, default: 0.0 },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const calculateDynamicAmountsFuture = ({
  qty,
  price,
  charges = 0,
  discount = 0,
  customerTaxes = [],
  customerDeductions = [],
  vendorTaxes = [],
  vendorDeductions = [],
}) => {
  // Step 1: Base Amount Calculation
  const baseAmount = qty * price + charges - discount;

  // Step 2: Customer Tax Calculations
  const totalCustomerTax = customerTaxes.reduce((sum, tax) => {
    const taxAmount = tax.amount || (tax.rate * baseAmount) / 100;
    tax.amount = taxAmount; // Update amount in-place
    return sum + taxAmount;
  }, 0);

  const amtAfterCustomerTax = baseAmount + totalCustomerTax;

  // Step 3: Customer Deductions
  const totalCustomerDeductions = customerDeductions.reduce(
    (sum, deduction) => {
      const deductionAmount =
        deduction.amount || (deduction.rate * amtAfterCustomerTax) / 100;
      deduction.amount = deductionAmount; // Update amount in-place
      return sum + deductionAmount;
    },
    0
  );

  const totalReceivable = amtAfterCustomerTax - totalCustomerDeductions;

  // Step 4: Vendor Tax Calculations
  const totalVendorTax = vendorTaxes.reduce((sum, tax) => {
    const taxAmount = tax.amount || (tax.rate * baseAmount) / 100;
    tax.amount = taxAmount; // Update amount in-place
    return sum + taxAmount;
  }, 0);

  const amtAfterVendorTax = baseAmount + totalVendorTax;

  // Step 5: Vendor Deductions
  const totalVendorDeductions = vendorDeductions.reduce((sum, deduction) => {
    const deductionAmount =
      deduction.amount || (deduction.rate * amtAfterVendorTax) / 100;
    deduction.amount = deductionAmount; // Update amount in-place
    return sum + deductionAmount;
  }, 0);

  const vendorReceivable = amtAfterVendorTax - totalVendorDeductions;

  return {
    customer: {
      baseAmount,
      totalCustomerTax,
      amtAfterCustomerTax,
      totalCustomerDeductions,
      totalReceivable,
    },
    vendor: {
      baseAmount,
      totalVendorTax,
      amtAfterVendorTax,
      totalVendorDeductions,
      vendorReceivable,
    },
  };
};

salesOrderSchemaFuture.pre("save", function (next) {
  const doc = this;

  const amounts = calculateDynamicAmounts({
    qty: doc.quantity,
    price: doc.price,
    charges: doc.charges,
    discount: doc.discount,
    customerTaxes: doc.customerTaxes,
    customerDeductions: doc.customerDeductions,
    vendorTaxes: doc.vendorTaxes,
    vendorDeductions: doc.vendorDeductions,
  });

  // Assign calculated amounts to the document
  doc.totalReceivable = amounts.customer.totalReceivable;
  doc.vendorReceivable = amounts.vendor.vendorReceivable;

  next();
});

/*
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
*/
