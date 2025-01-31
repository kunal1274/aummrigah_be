import { Schema, model } from "mongoose";
import { AllocationCounterModel } from "./counter.muuSHakaH.model.js";

const allocationSchema = new Schema(
  {
    allocationNum: {
      type: String,
      required: false,
      unique: true,
    },
    soId: {
      type: Schema.Types.ObjectId,
      ref: "SalesOrders",
      required: true,
    },
    salesPrice: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    salesDiscount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    salesCharges: {
      type: Number,
      required: true,
      default: 0.0,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100; // round off during save
      },
    },
    allocatedQuantity: { type: Number, default: 0 }, // Quantity successfully allocated
    failedQuantity: { type: Number, default: 0 }, // Quantity that failed allocation
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendors",
      required: false,
    },
    poId: {
      type: Schema.Types.ObjectId,
      ref: "PurchaseOrders",
      required: false,
    },
    purchPrice: {
      type: Number,
      required: true,
      default: 0.0,
      set: function (v) {
        return Math.round(v * 100) / 100;
      },
    },
    purchDiscount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    purchCharges: {
      type: Number,
      required: true,
      default: 0.0,
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "DRAFT",
        "PARTIAL",
        "CONFIRMED",
        "REJECTED",
        "CANCELLED",
        "FAILED",
        "CLOSED", // sales invoiced and purchase invoiced
        "FINALIZED", // payment also closed for this challan
      ],
      default: "DRAFT",
    },
    rideStatus: {
      type: String,
      required: true,
      enum: [
        //"RIDE_REQUESTED", // Customer requested a ride
        "ALLOCATOR_PROCESSING", // Allocator is finding a driver
        "DRIVER_ASSIGNED", // Driver has been assigned
        "EN_ROUTE_TO_PICKUP", // Driver is heading to the pickup location
        "AT_PICKUP_LOCATION", // Driver has reached the pickup location
        "WAITING_FOR_CUSTOMER", // Driver is waiting for the customer
        "RIDE_IN_PROGRESS", // Ride is in progress // sales shipped and purchase receiving in progress
        "RIDE_COMPLETED", // Ride has been completed > Sales delivered and purchase received
        "CANCELLED", // Ride was canceled
        "NO_SHOW", // Customer did not show up
      ],
      default: "ALLOCATOR_PROCESSING",
    },
    carType: {
      type: String,
      required: true,
      enum: ["Sedan", "SUV", "Hatchback"],
    }, // NEW FIELD
    transmissionType: {
      type: String,
      required: true,
      enum: ["Manual", "Automatic"],
    }, // NEW FIELD
    startDateTime: { type: Date, required: true }, // NEW FIELD
    endDateTime: { type: Date, required: true }, // NEW FIELD
    waypoints: [
      {
        location: { type: String, required: true },
        coordinates: {
          type: { type: String, enum: ["Point"], default: "Point" },
          coordinates: { type: [Number], required: true },
        },
        description: { type: String },
        type: {
          type: String,
          enum: ["PICKUP", "DROP_OFF", "STOP_OVER"],
          required: true,
          default: "PICKUP",
        },
      },
    ],

    createdBy: {
      type: String, // User ID or name
      required: true,
      default: "admin", // Default to 'admin' if not provided
    },
    updatedBy: {
      type: String, // User ID or name
      default: null, // Initially null, updated during updates
    },
    statusHistory: [
      {
        oldStatus: { type: String, required: true },
        newStatus: { type: String, required: true },
        changedBy: { type: String, required: true, default: "AdminAllocators" }, // User or system
        reason: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Define max retries
const MAX_RETRIES = 3;

allocationSchema.pre("save", async function (next) {
  if (!this.isNew) {
    return next();
  }
  if (this.isNew) {
    // Set `createdBy` only during document creation
    if (!this.createdBy) {
      this.createdBy = "admin"; // Default value if not provided
    }
  } else {
    // For updates, ensure `updatedBy` is set
    if (!this.updatedBy) {
      this.updatedBy = "admin1"; // Default value for updates
    }
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      // Validate the document
      await this.validate();

      // Check for duplicate allocationNum
      const existingAllocation = await AllocationModel.findOne({
        allocationNum: this.allocationNum,
      }).collation({
        locale: "en",
        strength: 2, // Case-insensitive collation
      });

      if (existingAllocation) {
        throw new Error(
          `An allocation with this allocationNum already exists: ${this.allocationNum}`
        );
      }

      // Increment counter for allocationNum
      const dbResponseNewCounter =
        await AllocationCounterModel.findOneAndUpdate(
          { _id: "allocationCode" },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

      if (!dbResponseNewCounter || dbResponseNewCounter.seq === undefined) {
        throw new Error("Failed to generate Allocation code");
      }

      // Generate allocationNum
      const seqNumber = dbResponseNewCounter.seq.toString().padStart(6, "0");
      this.allocationNum = `A_${seqNumber}`;
      return next(); // Exit loop and proceed
    } catch (error) {
      console.error(
        `Attempt ${retries + 1} failed to generate allocationNum:`,
        error.message
      );

      retries += 1;

      if (retries >= MAX_RETRIES) {
        console.error("Max retries reached. Aborting operation.");
        return next(
          new Error(
            "Failed to generate allocationNum after multiple attempts. Please try again."
          )
        );
      }
    }
  }
});

allocationSchema.pre("updateOne", async function (next) {
  // Ensure `updatedBy` is set during updates
  if (this.getUpdate().$set) {
    this.getUpdate().$set.updatedBy = "admin2"; // Replace with user context
  }
  next();
});

allocationSchema.pre("findOneAndUpdate", async function (next) {
  // Ensure `updatedBy` is set during updates
  if (this.getUpdate().$set) {
    this.getUpdate().$set.updatedBy = "admin2"; // Replace with user context
  }
  next();
});

export const AllocationModel = model("Allocations", allocationSchema);
