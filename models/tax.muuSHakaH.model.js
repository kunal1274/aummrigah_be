import { model, Schema } from "mongoose";
import { TaxCounterModel } from "./counter.muuSHakaH.model.js";

const taxSchema = new Schema(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    taxNum: {
      type: String,
      required: [true, "Tax Number is mandatory and it should be unique"],
      unique: true,
      validate: {
        validator: (v) => /^[A-Za-z0-9@._-]+$/.test(v), // Corrected regex
        message:
          "Tax Number can only contain alphanumeric characters, dashes, or underscores or @ or period",
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
        values: ["GST", "TDS", "TCS"],
        message: "{VALUE} is not a valid type. Use 'GST' or 'TDS' or 'TCS'.",
      },
      default: "GST",
    },
    component: {
      type: String,
      required: true,
      enum: {
        values: ["CGST", "SGST", "IGST", "TDS", "TCS"],
        message:
          "{VALUE} is not a valid component . Use among these only 'CGST','SGST','IGST','TDS'.'TCS'.",
      },
      validate: {
        validator: function (v) {
          if (
            this.type === "GST" &&
            !["CGST", "SGST", "IGST"].includes(value)
          ) {
            return false;
          }
          if (this.type === "TDS" && !["TDS"].includes(value)) {
            return false;
          }
          if (this.type === "TCS" && !["TCS"].includes(value)) {
            return false;
          }
          return true;
        },
      },
      default: "CGST",
    },
    percentage: {
      type: Number,
      default: null, // default to null for clarity
      validate: {
        validator: function (v) {
          return v === null || (v >= 0 && v <= 100);
        },
        message: `The percentage must be between 0 and 100 inclusive or null`,
      },
    },
    value: {
      type: Number,
      default: null,
      min: [0, "Tax value can't be negative"],
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

taxSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    // Validate the document (schema-level validation)
    await this.validate();

    // Check for duplicate itemNum (case-insensitive)
    const existingTax = await TaxModel.findOne({
      taxNum: this.taxNum,
    }).collation({
      locale: "en",
      strength: 2, // Case-insensitive collation
    });

    if (existingItem) {
      throw new Error(`A tax with this taxNum already exists: ${this.taxNum}`);
    }

    // Increment counter for item code
    const dbResponseNewCounter = await TaxCounterModel.findOneAndUpdate(
      { _id: "taxCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log("Tax Counter increment result:", dbResponseNewCounter);

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate tax code");
    }

    // Generate item code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    this.code = `T_${seqNumber}`;

    next();
  } catch (error) {
    console.error("Error caught during tax save:", error.stack);

    next(error);
  } finally {
    console.log("Finally tax counter closed");
  }
});

// Apply toJSON to include getters

// taxSchema.set("toJSON", { getters: true });

export const TaxModel = model("Tax", taxSchema);
