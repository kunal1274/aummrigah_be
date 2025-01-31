import { model, Schema } from "mongoose";
import { LedgerMappingCounterModel } from "./counter.muuSHakaH.model.js";

const ledgerMappingSchema = new Schema(
  {
    code: {
      type: String,
      unique: true,
    },
    ledgerMappingNum: {
      type: String,
      required: [true, "Ledger Mapping Number is mandatory and must be unique"],
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    mapping: {
      customer: [
        {
          key: { type: String, required: true }, // e.g., "AR"
          ledgerCode: {
            type: Schema.Types.ObjectId,
            ref: "LedgerAccounts",
            required: true,
          },
          metadata: {
            description: { type: String }, // Optional description
            isTaxApplicable: { type: Boolean, default: false },
            rate: { type: Number, min: 0, max: 100 }, // Optional percentage rate
          },
        },
      ],
      vendor: [
        {
          key: { type: String, required: true }, // e.g., "GST"
          ledgerCode: {
            type: Schema.Types.ObjectId,
            ref: "LedgerAccounts",
            required: true,
          },
          metadata: {
            description: { type: String },
            isTaxApplicable: { type: Boolean, default: false },
            rate: { type: Number, min: 0, max: 100 },
          },
        },
      ],
      item: [
        {
          key: { type: String, required: true }, // e.g., "Inventory"
          ledgerCode: {
            type: Schema.Types.ObjectId,
            ref: "LedgerAccounts",
            required: true,
          },
          metadata: {
            description: { type: String },
            isTaxApplicable: { type: Boolean, default: false },
            rate: { type: Number, min: 0, max: 100 },
          },
        },
      ],
      processFields: [
        {
          key: { type: String, required: true }, // Dynamic key name
          ledgerCode: {
            type: Schema.Types.ObjectId,
            ref: "LedgerAccounts",
            required: true,
          },
          metadata: {
            description: { type: String }, // Optional description
            isTaxApplicable: { type: Boolean, default: false },
            rate: { type: Number, min: 0, max: 100 }, // Optional percentage rate
          },
        },
      ],
      dynamicFields: [
        {
          key: { type: String, required: true }, // Dynamic key name
          ledgerCode: {
            type: Schema.Types.ObjectId,
            ref: "LedgerAccounts",
            required: true,
          },
          metadata: {
            description: { type: String }, // Optional description
            isTaxApplicable: { type: Boolean, default: false },
            rate: { type: Number, min: 0, max: 100 }, // Optional percentage rate
          },
        },
      ],
    },
    active: {
      type: Boolean,
      required: true,
      default: false,
    },
    version: {
      type: Number,
      required: true,
      default: 1, // Start with version 1
    },
    createdBy: {
      type: String, // User ID or name
      required: true,
      default: "admin",
    },
    updatedBy: {
      type: String, // User ID or name
      default: "admin1",
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      required: false,
    },
    allowOverrides: {
      type: Boolean,
      required: true,
      default: false, // Default to no overrides
    },
    validationRules: {
      type: Map, // Custom validation rules per key
      of: String, // JSON or stringified logic
    },
    metadata: {
      type: Map, // Dynamic key-value store for additional details
      of: String,
    },
    categories: {
      type: [String], // Array of categories
      default: [],
    },
    tags: {
      type: [String], // Array of tags
      default: [],
    },
    history: [
      {
        version: Number,
        mapping: Object,
        updatedBy: String,
        updatedAt: Date,
      },
    ],
    fallbackMapping: {
      type: String, // Default ledger account code
      required: false,
    },
    externalSystemMappings: {
      type: Map,
      of: String, // Key-value pairs for external systems
    },
  },
  { timestamps: true }
);

ledgerMappingSchema.pre("save", async function (next) {
  if (!this.isNew) {
    this.history.push({
      version: this.version,
      mapping: this.mapping,
      updatedBy: this.updatedBy,
      updatedAt: new Date(),
    });
    this.version += 1; // Increment version

    return next();
  }

  try {
    // Validate the document (schema-level validation)
    await this.validate();

    // Check for duplicate itemNum (case-insensitive)
    const existingLedgerMapping = await LedgerMappingModel.findOne({
      ledgerMappingNum: this.ledgerMappingNum,
    }).collation({
      locale: "en",
      strength: 2, // Case-insensitive collation
    });

    if (existingLedgerMapping) {
      throw new Error(
        `A Ledger Mapping with this ledgerMappingNum already exists: ${this.ledgerMappingNum}`
      );
    }

    // Increment counter for item code
    const dbResponseNewCounter =
      await LedgerMappingCounterModel.findOneAndUpdate(
        { _id: "ledgerMappingCode" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

    console.log(
      "Ledger Mapping Counter increment result:",
      dbResponseNewCounter
    );

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate Ledger Mapping code");
    }

    // Generate item code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    this.code = `LM_${seqNumber}`;

    next();
  } catch (error) {
    console.error("Error caught during Ledger Mapping save:", error.stack);

    next(error);
  } finally {
    console.log("Finally Ledger Mapping counter closed");
  }
});

// Apply toJSON to include getters

// itemSchema.set("toJSON", { getters: true });

export const LedgerMappingModel = model("LedgerMapping", ledgerMappingSchema);

/**
 // testing json for this : 
{
  "code": "LM_001",
  "ledgerMappingNum": "LM001",
  "name": "Default Mapping",
  "mapping": {
    "customer": [
      { "key": "AR", "ledgerCode": "1001", "metadata": { "description": "Accounts Receivable", "isTaxApplicable": false } },
      { "key": "GST", "ledgerCode": "2001", "metadata": { "description": "Goods and Services Tax", "isTaxApplicable": true, "rate": 18 } }
    ],
    "vendor": [
      { "key": "AP", "ledgerCode": "4001", "metadata": { "description": "Vendor Accounts Payable" } }
    ],
    "item": [
      { "key": "Inventory", "ledgerCode": "7001", "metadata": { "description": "Inventory Account" } }
    ],
    "dynamicFields": {
      "Commission": "8001",
      "Royalty": "8002"
    }
  },
  "active": true,
  "version": 2,
  "createdBy": "admin",
  "updatedBy": "manager",
  "effectiveFrom": "2024-01-01T00:00:00.000Z",
  "categories": ["Finance"],
  "tags": ["High Priority"],
  "history": [
    {
      "version": 1,
      "mapping": {
        "customer": [{ "key": "AR", "ledgerCode": "1001" }]
      },
      "updatedBy": "admin",
      "updatedAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "externalSystemMappings": {
    "SAP": "SAP_123",
    "QuickBooks": "QB_123"
  },
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-02T12:00:00.000Z"
}

  
 */
