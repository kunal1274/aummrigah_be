import { model, Schema } from "mongoose";
import { CustomerCounterModel } from "./counter.model.js";
import mongoose from "mongoose";

const customerSchema = new Schema({
  code: {
    type: String,
    required: false,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  contactNum: {
    type: String,
    required: [true, "Contact number is required."],
    unique: true,
    minlength: [
      10,
      "The phone number should be exactly 10 digits without country code.",
    ],
    maxlength: [10, "The phone number should be exactly 10 digits."],
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Only allows exactly 10 digits
      },
      message:
        "Contact number must be a 10-digit number without any letters or special characters.",
    },
  },
  currency: {
    type: String,
    required: true,
    enum: ["INR", "USD", "EUR", "GBP"],
    default: "INR",
  },
  registrationNum: {
    type: String,
    required: true,
    minLength: [16, `The registration number should be with min. 16 chars`],
    maxLength: [16, `The registration number cannot be greater than 16 chars.`],
  },
  panNum: {
    type: String,
    required: true,
    minLength: [10, `The pan number should be with min. 10 chars`],
    maxLength: [10, `The pan number cannot be greater than 10 chars.`],
  },
  address: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

// customerSchema.pre("save", async function (next) {
//   const version = 1;
//   const doc = this; // means whoever is calling and here customer Schema is calling or customer model
//   switch (version) {
//     case 0:
//       if (doc.isNew) {
//         try {
//           // find and increment the counter for the customer code

//           const dbResponseNewCounter =
//             await CustomerCounterModel.findByIdAndUpdate(
//               { _id: "customerCode" },
//               { $inc: { seq: 1 } },
//               { new: true, upsert: true }
//             );
//           console.log(dbResponseNewCounter);
//           // Ensure the seq field exists
//           if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
//             throw new Error("Failed to generate customer code");
//           }
//           // Generate with padding of 5 digits
//           const seqNumber = dbResponseNewCounter.seq
//             .toString()
//             .padStart(6, "0");

//           doc.code = `CUST_${seqNumber}`;

//           next();
//         } catch (error) {
//           next(error);
//         }
//       } else {
//         next();
//       }
//       break;

//     case 1:
//       if (doc.isNew) {
//         try {
//           // find and increment the counter for the customer code
//           const session = await mongoose.startSession();
//           session.startTransaction();

//           const dbResponseNewCounter =
//             await CustomerCounterModel.findByIdAndUpdate(
//               { _id: "customerCode" },
//               { $inc: { seq: 1 } },
//               { new: true, upsert: true, session }
//             );
//           console.log(dbResponseNewCounter, session);
//           // Ensure the seq field exists
//           if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
//             throw new Error("Failed to generate customer code");
//           }
//           // Generate with padding of 5 digits
//           const seqNumber = dbResponseNewCounter.seq
//             .toString()
//             .padStart(6, "0");

//           doc.code = `CUST_${seqNumber}`;

//           await session.commitTransaction();
//           session.endSession();

//           next();
//         } catch (error) {
//           await session.abortTransaction();
//           session.endSession();

//           next(error);
//         }
//       } else {
//         next();
//       }
//       break;
//     default:
//       cl(
//         `The error is from the customerSchema.pre save while generating the customer code.`
//       );
//       break;
//   }
// });

// Function for version 0 logic

const version0Handler = async (doc, next) => {
  try {
    // Increment counter
    const dbResponseNewCounter = await CustomerCounterModel.findOneAndUpdate(
      { _id: "customerCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate customer code");
    }

    // Generate customer code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    doc.code = `CUST_${seqNumber}`;
    next();
  } catch (error) {
    next(error);
  }
};

// Function for version 1 logic with transactions
const version1Handler = async (doc, next) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    try {
      doc.validate();
    } catch (error) {
      throw new Error("Validation Error", error);
    }

    // Increment counter within a transaction
    const dbResponseNewCounter = await CustomerCounterModel.findOneAndUpdate(
      { _id: "customerCode" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, session }
    );

    console.log("Counter increment result:", dbResponseNewCounter);
    console.log("Transaction status:", session.inTransaction());

    if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
      throw new Error("Failed to generate customer code");
    }

    // Generate customer code
    const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
    doc.code = `CUST_${seqNumber}`;

    await session.commitTransaction();
    next();
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

// Main pre-save hook
customerSchema.pre("save", async function (next) {
  const version = 1; // Change this to switch between versions
  const doc = this;

  if (!doc.isNew) {
    return next(); // Skip processing for existing documents
  }

  switch (version) {
    case 0:
      await version0Handler(doc, next);
      break;
    case 1:
      await version1Handler(doc, next);
      break;
    default:
      console.error(
        "Invalid version specified for customerSchema pre-save hook."
      );
      next(new Error("Invalid version specified."));
      break;
  }
});

export const CustomerModel = model("Customers", customerSchema);
