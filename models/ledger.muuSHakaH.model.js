import { model, Schema } from "mongoose";
import { LedgerAccountCounterModel } from "./counter.muuSHakaH.model.js";

const ledgerAccountSchema = new Schema(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    ledgerAccountNum: {
      type: String,
      required: [
        true,
        "Ledger Account Number is mandatory and it should be unique",
      ],
      unique: true,
      validate: {
        validator: (v) => /^[A-Za-z0-9_-]+$/.test(v),
        message:
          "Ledger Account Number can only contain alphanumeric characters, dashes, or underscores.",
      },
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: [
          "Balance Sheet",
          "Profit and Loss",
          "Asset",
          "Expense",
          "Liability",
          "Revenue",
          "Total",
          "Reporting",
        ],
        message:
          "{VALUE} is not a valid type. Use 'Balance Sheet','Profit and Loss','Asset','Expense','Liability','Revenue','Total','Reporting'.",
      },
      default: "Balance Sheet",
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
  {
    timestamps: true,
  }
);

ledgerAccountSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    // Validate the document (schema-level validation)
    await this.validate();

    // Check for duplicate itemNum (case-insensitive)
    const existingLedgerAccount = await LedgerAccountModel.findOne({
      ledgerAccountNum: this.ledgerAccountNum,
    }).collation({
      locale: "en",
      strength: 2, // Case-insensitive collation
    });

    if (existingLedgerAccount) {
      throw new Error(
        `A Ledger Account with this ledgerAccountNum already exists: ${this.ledgerAccountNum}`
      );
    }

    // Increment counter for item code
    const dbResponseNewCounter =
      await LedgerAccountCounterModel.findOneAndUpdate(
        { _id: "ledgerAccountCode" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

    console.log(
      "Ledger Account Counter increment result:",
      dbResponseNewCounter
    );

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate Ledger Account code");
    }

    // Generate item code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    this.code = `L_${seqNumber}`;

    next();
  } catch (error) {
    console.error("Error caught during Ledger Account save:", error.stack);

    next(error);
  } finally {
    console.log("Finally Ledger Account counter closed");
  }
});

// Apply toJSON to include getters

// itemSchema.set("toJSON", { getters: true });

export const LedgerAccountModel = model("LedgerAccounts", ledgerAccountSchema);
