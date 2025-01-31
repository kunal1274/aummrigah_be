import { model, Schema } from "mongoose";
import { BankCounterModel } from "./counter.muuSHakaH.model.js";

const bankSchema = new Schema(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ["Cash", "Bank", "UPI", "Crypto", "Barter"],
        message:
          "{VALUE} is not a valid type. Use 'Cash' or 'Bank' or 'UPI' or 'Crypto' or 'Barter'.",
      },
      default: "Bank",
    },
    bankNum: {
      type: String,
      required: [
        true,
        "Bank Account or UPI or Crypto Number  is mandatory and it should be unique",
      ],
      unique: true,
      validate: {
        validator: (v) => /^[A-Za-z0-9@._-]+$/.test(v), // Corrected regex
        message:
          "Bank Account or UPI or Crypto Number can only contain alphanumeric characters, dashes, or underscores or @ or .",
      },
    },
    name: {
      type: String,
      required: true,
    },
    ifsc: {
      type: String,
      required: false,
    },
    swift: {
      type: String,
      required: false,
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

bankSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    // Validate the document (schema-level validation)
    await this.validate();

    // Check for duplicate itemNum (case-insensitive)
    const existingBank = await BankModel.findOne({
      bankNum: this.bankNum,
    }).collation({
      locale: "en",
      strength: 2, // Case-insensitive collation
    });

    if (existingBank) {
      throw new Error(
        `An bank with this bankNum already exists: ${this.bankNum}`
      );
    }

    // Increment counter for item code
    const dbResponseNewCounter = await BankCounterModel.findOneAndUpdate(
      { _id: "bankCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log("Bank Counter increment result:", dbResponseNewCounter);

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate bank code");
    }

    // Generate item code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    this.code = `B_${seqNumber}`;

    next();
  } catch (error) {
    console.error("Error caught during bank save:", error.stack);

    next(error);
  } finally {
    console.log("Finally bank counter closed");
  }
});

// Apply toJSON to include getters

// bankSchema.set("toJSON", { getters: true });

export const BankModel = model("Banks", bankSchema);
