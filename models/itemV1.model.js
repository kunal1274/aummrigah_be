import { model, Schema } from "mongoose";
import { ItemCounterModel } from "./counter.model.js";

import winston from "winston";

export const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
  ],
});

const itemSchema = new Schema(
  {
    code: {
      type: String,
      required: false,
      unique: true,
    },
    itemNum: {
      type: String,
      required: [true, "Item Number is mandatory and it should be unique"],
      unique: true,
      validate: {
        validator: (v) => /^[A-Za-z0-9_-]+$/.test(v),
        message:
          "Item Number can only contain alphanumeric characters, dashes, or underscores.",
      },
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
        values: ["Goods", "Services"],
        message: "{VALUE} is not a valid type. Use 'Goods' or 'Services'.",
      },
      default: "Goods",
    },
    unit: {
      type: String,
      required: true,
      enum: {
        values: ["ea", "qty", "mt", "kgs", "lbs", "hr", "min"],
        message:
          "{VALUE} is not a valid unit . Use among these only'ea','qty','mt','kgs'.'lbs',hr','min'.",
      },
      default: "mt",
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // round off during save
      },
      get: (v) => v.toFixed(2), // Format when retrieving
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

// itemSchema.pre("save", async function (next) {
//   const version = 0;
//   const doc = this; // means whoever is calling and here item Schema is calling or customer model
//   switch (version) {
//     case 0:
//       if (doc.isNew) {
//         try {
//           // find and increment the counter for the customer code

//           // const dbResponseNewCounter =
//           //   await CustomerCounterModel.findByIdAndUpdate(
//           //     { _id: "customerCode" },
//           //     { $inc: { seq: 1 } },
//           //     { new: true, upsert: true }
//           //   );
//           const dbResponseNewCounter = await ItemCounterModel.findByIdAndUpdate(
//             { _id: "itemCode" },
//             { $inc: { seq: 1 } },
//             { new: true, upsert: true }
//           );
//           console.log(dbResponseNewCounter);
//           // Replace console.log with logger.info or logger.error
//           winstonLogger.info(dbResponseNewCounter);
//           // Ensure the seq field exists
//           if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
//             throw new Error("Failed to generate item code");
//           }
//           // Generate with padding of 5 digits
//           const seqNumber = dbResponseNewCounter.seq
//             .toString()
//             .padStart(6, "0");

//           doc.code = `ITEM_${seqNumber}`;

//           next();
//         } catch (error) {
//           next(error);
//         }
//       } else {
//         next();
//       }
//       break;

//     default:
//       cl(
//         `The error is from the itemSchema.pre save while generating the item code.`
//       );
//       break;
//   }
// });

itemSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }

  try {
    // Validate the document (schema-level validation)
    await this.validate();

    // // Check for duplicates in the database
    // const existingItem = await ItemModel.findOne({
    //   itemNum: this.itemNum,
    // });

    // if (existingItem) {
    //   throw new Error(`Duplicate item number: ${this.itemNum}`);
    // }

    // Increment counter for item code
    const dbResponseNewCounter = await ItemCounterModel.findOneAndUpdate(
      { _id: "itemCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log("Counter increment result:", dbResponseNewCounter);

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate item code");
    }

    // Generate item code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    this.code = `ITEM_${seqNumber}`;

    next();
  } catch (error) {
    console.error("Error caught during item save:", error.stack);

    // Decrement the counter in case of failure
    try {
      //const isCounterIncremented =
      // error.message && !error.message.startsWith("Duplicate item number");
      //if (isCounterIncremented) {
      await ItemCounterModel.findByIdAndUpdate(
        { _id: "itemCode" },
        { $inc: { seq: -1 } }
      );
      //}
    } catch (decrementError) {
      console.error("Error during counter decrement:", decrementError.stack);
    }

    next(error);
  } finally {
    console.log("Finally item counter closed");
  }
});

// Apply toJSON to include getters

itemSchema.set("toJSON", { getters: true });

// Define indexes
itemSchema.index({ code: 1 }); // Index for code
itemSchema.index({ itemNum: 1 }); // Index for itemNum
//itemSchema.index({ code: 1, itemNum: 1 }); // Compound index for code and itemNum

export const ItemModel = model("Items", itemSchema);
