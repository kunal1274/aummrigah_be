import mongoose from "mongoose";
import { AllocationModel } from "../models/allocation.muuSHakaH.model.js";
import { PurchaseOrderModel } from "../models/purchaseorders.muuSHakaH.model.js";
import { SalesOrderModel } from "../models/salesorders.muuSHakaH.model.js";
import { logError } from "../utility/logError.muuSHakaH.utils.js";
import { VendorModel } from "../models/vendor.muuSHakaH.model.js";

// Utility for centralized error response
const sendErrorResponse = (res, statusCode, message, error = null) => {
  return res.status(statusCode).send({
    status: "failure",
    message,
    ...(error && { error }),
  });
};

// On Booking
// create the sales orders with the customer and qty of hours which is required.
//createSalesOrder

export const getAllAllocations = async (req, res) => {
  try {
    // Retrieve all allocations with sales order and vendor details populated
    const allocations = await AllocationModel.find()
      .populate("soId", "orderNum quantity releasedQuantity status")
      .populate("vendor", "name contactNum address");

    if (!allocations || allocations.length === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No allocations found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Allocations retrieved successfully.",
      count: allocations.length,
      data: allocations,
    });
  } catch (error) {
    logError("Get All Allocations", error);
    return res.status(500).send({
      status: "failure",
      message: "Error retrieving allocations.",
      error: error.message,
    });
  }
};

export const createSoftAllocation = async (req, res) => {
  const {
    salesOrderId,
    quantity,
    vendorId,
    salesPrice,
    salesCharges,
    salesDiscount,
    purchPrice,
    purchCharges,
    purchDiscount,
  } = req.body;

  // Validate input
  if (!salesOrderId || !quantity || quantity <= 0) {
    return res.status(422).send({
      status: "failure",
      message: "Sales Order ID and positive Quantity are required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Sales Order
    const salesOrder = await SalesOrderModel.findById(salesOrderId)
      .populate("item", "quantity releasedQuantity price salesPrice purchPrice") // Populate related Item details
      .session(session);

    if (!salesOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Sales order with ID ${salesOrderId} not found.`,
      });
    }

    // Check if the Sales Order is Confirmed
    if (salesOrder.status !== "CONFIRMED") {
      return res.status(400).send({
        status: "failure",
        message: `Allocations can only be created for Confirmed Sales Orders.`,
      });
    }

    const availableQty = salesOrder.quantity - salesOrder.releasedQuantity;
    if (quantity > availableQty) {
      throw new Error(
        `Insufficient quantity in Sales Order. Available: ${availableQty}.`
      );
    }

    // Generate unique Allocation Number
    const allocationCount = await AllocationModel.countDocuments();
    const seq = (allocationCount + 1).toString().padStart(6, "0");
    const allocationNum = `AL_${seq}`;

    // Create the Allocation Transaction
    const allocationTx = new AllocationModel({
      allocationNum,
      soId: salesOrder._id,
      quantity,
      salesPrice: salesPrice || salesOrder.price || salesOrder.item.salesPrice,
      salesCharges: salesCharges || salesOrder.charges,
      salesDiscount: salesDiscount || salesOrder.discount,
      vendor: vendorId || null, // Can be null for soft allocation
      purchPrice: purchPrice || salesOrder.item.purchPrice,
      purchCharges: purchCharges || 0,
      purchDiscount: purchDiscount || 0,
      rideStatus: "ALLOCATOR_PROCESSING",
    });

    await allocationTx.save({ session });

    // Reduce the quantity in the Sales Order
    salesOrder.releasedQuantity += quantity;
    await salesOrder.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(201).send({
      status: "success",
      message: `Allocation Transaction ${allocationNum} created successfully.`,
      data: allocationTx,
    });
  } catch (error) {
    await session.abortTransaction();

    logError("Error creating allocation transaction:", error);
    return res.status(500).send({
      status: "failure",
      message: "Error creating allocation transaction.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const updateAllocation = async (req, res) => {
  const { allocationId } = req.params;
  const { status, rejectionReason } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch Allocation
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation with ID ${allocationId} not found.`,
      });
    }

    // Handle status transitions
    switch (status) {
      case "CONFIRMED":
        if (allocation.status !== "DRAFT") {
          throw new Error("Only Draft allocations can be confirmed.");
        }
        allocation.status = "CONFIRMED";
        break;

      case "Retry":
        if (allocation.status !== "FAILED") {
          throw new Error("Only Failed allocations can be retried.");
        }
        allocation.status = "DRAFT"; // Reset to Draft
        allocation.failureReason = null;
        break;

      case "REJECTED":
        if (allocation.status !== "CONFIRMED") {
          throw new Error("Only Confirmed allocations can be rejected.");
        }
        allocation.status = "REJECTED";
        allocation.rejectionReason = rejectionReason;
        break;

      default:
        throw new Error("Invalid status value.");
    }

    await allocation.save({ session });
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: `Allocation status updated to ${status}.`,
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).send({
      status: "failure",
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const confirmAllocation = async (req, res) => {
  const { allocationId } = req.params;
  const { vendorId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Allocation Transaction
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation transaction with ID ${allocationId} not found.`,
      });
    }

    if (allocation.status !== "DRAFT") {
      return res.status(400).send({
        status: "failure",
        message: `Only Draft allocations can be confirmed.`,
      });
    }

    // Validate Vendor
    if (vendorId) {
      const vendorExists = await VendorModel.findById(vendorId).session(
        session
      );
      if (!vendorExists) {
        return res.status(404).send({
          status: "failure",
          message: `Vendor with ID ${vendorId} does not exist.`,
        });
      }
    }

    // Fetch the associated Sales Order
    const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
      session
    );

    if (!salesOrder) {
      throw new Error(`Sales order with ID ${allocation.soId} not found.`);
    }

    // Update Allocation Status
    allocation.vendor = vendorId;
    allocation.status = "CONFIRMED";

    console.log(`1st task : vendor and confirmed status done till now`);

    // Calculate line amount
    const lineAmt =
      allocation.quantity * allocation.purchPrice +
      allocation.purchCharges -
      allocation.purchDiscount;

    // Create the Purchase Order
    const poData = {
      vendor: vendorId,
      currency: allocation.currency,
      item: salesOrder.item,
      quantity: allocation.quantity,
      price: allocation.purchPrice,
      discount: allocation.purchDiscount,
      charges: allocation.purchCharges,
      lineAmt,
      allocationId: allocation._id,
      soId: allocation.soId,
    };

    const purchaseOrder = new PurchaseOrderModel(poData);
    await purchaseOrder.save({ session });
    console.log(`2nd task : PO creation in progress and shud be done by now`);

    // Update the allocation with the purchase order number
    allocation.poId = purchaseOrder._id;
    await allocation.save({ session });
    console.log(`3rd task : PO id attachment to allocation is done here`);

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: "Allocation confirmed and Purchase Order created successfully.",
      data: {
        "Allocation details": allocation,
        customer: salesOrder.customer,
        vendor: purchaseOrder.vendor,
        item: salesOrder.item,
        "Sales Order details": salesOrder,
        "Purchase Order details": purchaseOrder,
      },
    });
  } catch (error) {
    // Rollback the transaction in case of failure
    await session.abortTransaction();

    console.error("Allocation confirmation failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Allocation confirmation failed.",
      error: error.message,
    });
  } finally {
    // End the session
    session.endSession();
  }
};

export const updateRideStatus = async (req, res) => {
  const { allocationId } = req.params;
  let session;

  try {
    // Start a session for transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Fetch the allocation document
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return sendErrorResponse(
        res,
        404,
        `Allocation transaction with ID ${allocationId} not found.`
      );
    }
    console.log(allocation);
    // State transition handling
    switch (allocation.rideStatus) {
      case "ALLOCATOR_PROCESSING":
        allocation.rideStatus = "DRIVER_ASSIGNED";
        await allocation.save({ session });

        await session.commitTransaction();
        return res.status(200).send({
          status: "success",
          message: `The booking ID ${allocationId} has been assigned a driver.`,
          data: {
            allocationDetails: allocation,
            driverVendor: allocation.driver,
          },
        });

      case "DRIVER_ASSIGNED":
        const purchaseOrder = await PurchaseOrderModel.findById(
          allocation.poId
        ).session(session);

        if (!purchaseOrder) {
          return sendErrorResponse(
            res,
            404,
            `Purchase order ID ${allocation.poId} not found.`
          );
        }

        purchaseOrder.status = "Confirmed";
        await purchaseOrder.save({ session });

        allocation.rideStatus = "EN_ROUTE_TO_PICKUP";
        await allocation.save({ session });

        await session.commitTransaction();
        return res.status(200).send({
          status: "success",
          message: `The booking ID ${allocationId} is now en route to the pickup location.`,
          data: {
            allocationDetails: allocation,
            driverVendor: allocation.driver,
          },
        });

      default:
        return sendErrorResponse(
          res,
          400,
          `Invalid state transition from ${allocation.rideStatus}.`
        );
    }
  } catch (error) {
    // Rollback the transaction in case of failure
    if (session) await session.abortTransaction();

    console.error("Error in ride status update:", error);
    return sendErrorResponse(
      res,
      500,
      "Ride status update failed.",
      error.message
    );
  } finally {
    // End the session
    if (session) session.endSession();
  }
};

export const retryAllocation = async (req, res) => {
  const { allocationId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Allocation
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation with ID ${allocationId} not found.`,
      });
    }

    if (allocation.status !== "FAILED") {
      return res.status(400).send({
        status: "failure",
        message: "Only failed allocations can be retried.",
      });
    }

    // Fetch the Sales Order
    const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
      session
    );

    if (!salesOrder) {
      throw new Error(`Sales order with ID ${allocation.soId} not found.`);
    }

    // Ensure sufficient quantity in Sales Order
    const availableQuantity = salesOrder.quantity - salesOrder.releasedQuantity;
    if (allocation.quantity > availableQuantity) {
      throw new Error(
        `Insufficient quantity available in Sales Order. Required: ${allocation.quantity}, Available: ${availableQuantity}`
      );
    }

    // Validate Vendor
    if (allocation.vendor) {
      const vendorExists = await VendorModel.findById(
        allocation.vendor
      ).session(session);
      if (!vendorExists) {
        throw new Error(`Vendor with ID ${allocation.vendor} does not exist.`);
      }
    }

    // Reset Allocation
    allocation.status = "DRAFT";
    allocation.failureReason = null;

    // Retry Allocation
    const lineAmt =
      allocation.quantity * allocation.purchPrice +
      allocation.purchCharges -
      allocation.purchDiscount;

    // Create the Purchase Order
    const poData = {
      vendor: allocation.vendor,
      currency: allocation.currency,
      item: salesOrder.item,
      quantity: allocation.quantity,
      price: allocation.purchPrice,
      discount: allocation.purchDiscount,
      charges: allocation.purchCharges,
      lineAmt,
      allocationId: allocation._id,
      salesOrderId: allocation.soId,
    };

    const purchaseOrder = new PurchaseOrderModel(poData);
    await purchaseOrder.save({ session });

    // Update Allocation with Purchase Order ID
    allocation.poId = purchaseOrder._id;
    allocation.status = "CONFIRMED";
    await allocation.save({ session });

    // Update Sales Order's released quantity
    salesOrder.releasedQuantity += allocation.quantity;
    await salesOrder.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: "Allocation retried and Purchase Order created successfully.",
      data: {
        allocation,
        purchaseOrder,
      },
    });
  } catch (error) {
    // Rollback transaction
    await session.abortTransaction();
    console.error("Retry allocation failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to retry allocation.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const reassignAllocation = async (req, res) => {
  const { allocationId } = req.params;
  const { newVendorId } = req.body;

  if (!allocationId || !newVendorId) {
    return res.status(422).send({
      status: "failure",
      message: "Allocation ID and new Vendor ID are required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Fetch Allocation with transactional safety
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation transaction with ID ${allocationId} not found.`,
      });
    }

    // Ensure the allocation is in a "Rejected" state
    if (allocation.status !== "REJECTED") {
      return res.status(400).send({
        status: "failure",
        message: "Only rejected allocations can be reassigned.",
      });
    }

    // Validate the new vendor with transactional safety
    const newVendor = await VendorModel.findById(newVendorId).session(session);
    if (!newVendor) {
      return res.status(404).send({
        status: "failure",
        message: `Vendor with ID ${newVendorId} not found.`,
      });
    }

    // Update Allocation
    allocation.vendor = newVendorId;
    allocation.status = "DRAFT"; // Reset status for reassignment
    allocation.rejectionReason = null; // Clear previous rejection reason

    // Optionally, log status history
    allocation.statusHistory = allocation.statusHistory || [];
    allocation.statusHistory.push({
      oldStatus: "REJECTED",
      newStatus: "DRAFT",
      changedBy: req.user?.id || "System", // Assuming user ID is available in the request
      reason: "Reassignment to a new vendor",
      timestamp: new Date(),
    });

    await allocation.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: "Allocation reassigned successfully.",
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Allocation reassignment failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to reassign allocation.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const handleVendorRejection = async (req, res) => {
  const { allocationId } = req.params;
  const { rejectionReason, newVendorId } = req.body;

  if (!allocationId) {
    return res.status(422).send({
      status: "failure",
      message: "Allocation ID are required.",
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Allocation Transaction
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation transaction with ID ${allocationId} not found.`,
      });
    }

    if (allocation.status !== "CONFIRMED") {
      return res.status(400).send({
        status: "failure",
        message: "Only confirmed allocations can be rejected.",
      });
    }

    // Fetch the Sales Order
    const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
      session
    );

    if (!salesOrder) {
      throw new Error(`Sales order with ID ${allocation.soId} not found.`);
    }

    // Update Allocation Transaction
    allocation.status = "REJECTED";
    allocation.rejectionReason = rejectionReason;

    // Add rejection to status history
    allocation.statusHistory = allocation.statusHistory || [];
    allocation.statusHistory.push({
      oldStatus: "CONFIRMED",
      newStatus: "REJECTED",
      changedBy: req.user?.id || "System",
      reason: rejectionReason,
      timestamp: new Date(),
    });

    await allocation.save({ session });

    // Update Purchase Order (if exists)
    const purchaseOrder = await PurchaseOrderModel.findOne({
      allocationId: allocation._id,
    }).session(session);

    if (purchaseOrder) {
      purchaseOrder.status = "REJECTED";
      purchaseOrder.rejectionReason = rejectionReason;
      await purchaseOrder.save({ session });
    }

    // Commit the transaction
    await session.commitTransaction();

    // If a new vendor is provided, call the reassignAllocation method
    if (newVendorId) {
      return reassignAllocation(
        {
          body: { allocationId, newVendorId },
          user: req.user, // Pass user details if needed
        },
        res
      );
    }

    return res.status(200).send({
      status: "success",
      message: "Vendor rejection handled successfully.",
      data: { allocation, purchaseOrder },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Vendor rejection handling failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to handle vendor rejection.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const handlePartialAllocation = async (req, res) => {
  const { allocationId } = req.params;
  const { quantity, vendorId } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Allocation
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation with ID ${allocationId} not found.`,
      });
    }

    // Ensure Allocation is in Draft status
    if (allocation.status !== "DRAFT" && allocation.status !== "PARTIAL") {
      return res.status(400).send({
        status: "failure",
        message: "Only Draft or Partial allocations can be retried.",
      });
    }

    // Fetch Sales Order
    const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
      session
    );

    if (!salesOrder) {
      throw new Error(`Sales order with ID ${allocation.soId} not found.`);
    }

    // Check available quantity
    const availableQuantity = salesOrder.quantity - salesOrder.releasedQuantity;
    if (quantity > availableQuantity) {
      throw new Error(
        `Insufficient quantity available in Sales Order. Requested: ${quantity}, Available: ${availableQuantity}`
      );
    }

    // Validate Vendor
    if (vendorId) {
      const vendorExists = await VendorModel.findById(vendorId).session(
        session
      );
      if (!vendorExists) {
        throw new Error(`Vendor with ID ${vendorId} does not exist.`);
      }
    }

    // Attempt Allocation
    let allocatedQuantity = 0;
    let failedQuantity = quantity;

    try {
      // Simulate partial allocation success (e.g., allocate 70% of the quantity)
      allocatedQuantity = Math.floor(quantity * 0.7);
      failedQuantity = quantity - allocatedQuantity;

      // Update Allocation
      allocation.allocatedQuantity += allocatedQuantity;
      allocation.failedQuantity = failedQuantity;
      allocation.status = failedQuantity > 0 ? "PARTIAL" : "CONFIRMED";
      allocation.vendor = vendorId;
      allocation.failureReason =
        failedQuantity > 0 ? "Partial allocation due to system limits" : null;

      await allocation.save({ session });

      // Update Sales Order
      salesOrder.releasedQuantity += allocatedQuantity;
      await salesOrder.save({ session });
    } catch (error) {
      console.error("Partial allocation error:", error.message);
    }

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: `Partial Allocation handled successfully.`,
      data: {
        allocation,
        allocatedQuantity,
        failedQuantity,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Handling partial allocation failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to handle partial allocation.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const retryPartialAllocation = async (req, res) => {
  const { allocationId } = req.params;

  try {
    const allocation = await AllocationModel.findById(allocationId);

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation with ID ${allocationId} not found.`,
      });
    }

    if (allocation.status !== "PARTIAL") {
      return res.status(400).send({
        status: "failure",
        message: "Only partial allocations can be retried.",
      });
    }

    const remainingQuantity = allocation.failedQuantity;
    allocation.failedQuantity = 0;

    // Retry allocation logic
    const retryResult = await handlePartialAllocation({
      params: { allocationId },
      body: { quantity: remainingQuantity, vendorId: allocation.vendor },
    });

    return res.status(200).send({
      status: "success",
      message: "Partial allocation retried successfully.",
      data: retryResult.data,
    });
  } catch (error) {
    console.error("Retry partial allocation failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to retry partial allocation.",
      error: error.message,
    });
  }
};

export const handleVendorRejection1 = async (req, res) => {
  const { allocationId } = req.params;
  const { rejectionReason } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch the Allocation Transaction
    const allocation = await AllocationModel.findById(allocationId).session(
      session
    );

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation transaction with ID ${allocationId} not found.`,
      });
    }

    if (allocation.status !== "Confirmed") {
      return res.status(400).send({
        status: "failure",
        message: "Only confirmed allocations can be rejected.",
      });
    }

    // Fetch the Sales Order
    const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
      session
    );

    if (!salesOrder) {
      throw new Error(`Sales order with ID ${allocation.soId} not found.`);
    }

    // Update Allocation Transaction
    allocation.status = "Rejected";
    allocation.rejectionReason = rejectionReason;
    await allocation.save({ session });

    // Update Purchase Order (if exists)
    const purchaseOrder = await PurchaseOrderModel.findOne({
      allocationId: allocation._id,
    }).session(session);

    if (purchaseOrder) {
      purchaseOrder.status = "Rejected";
      purchaseOrder.rejectionReason = rejectionReason;
      await purchaseOrder.save({ session });
    }

    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: "Vendor rejection handled successfully.",
      data: { allocation, purchaseOrder },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Vendor rejection handling failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to handle vendor rejection.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const reassignAllocation1 = async (req, res) => {
  const { allocationId, newVendorId } = req.body;

  if (!allocationId || !newVendorId) {
    return res.status(422).send({
      status: "failure",
      message: "Allocation ID and new Vendor ID are required.",
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Fetch Allocation and Vendor in parallel
    const [allocation, newVendor] = await Promise.all([
      AllocationModel.findById(allocationId).session(session),
      VendorModel.findById(newVendorId).session(session),
    ]);

    if (!allocation) {
      return res.status(404).send({
        status: "failure",
        message: `Allocation transaction with ID ${allocationId} not found.`,
      });
    }

    if (!newVendor) {
      return res.status(404).send({
        status: "failure",
        message: `Vendor with ID ${newVendorId} not found.`,
      });
    }

    // Ensure allocation is in a "Rejected" state
    if (allocation.status !== "Rejected") {
      return res.status(400).send({
        status: "failure",
        message: "Only rejected allocations can be reassigned.",
      });
    }

    // Update Allocation
    allocation.vendor = newVendorId;
    allocation.status = "Draft"; // Reset to Draft for reassignment
    allocation.rejectionReason = null; // Clear previous rejection reason

    // Add status change to history
    allocation.statusHistory = allocation.statusHistory || [];
    allocation.statusHistory.push({
      oldStatus: "Rejected",
      newStatus: "Draft",
      changedBy: req.user?.id || "System", // Assuming user ID is available
      reason: "Reassigned to a new vendor",
      timestamp: new Date(),
    });

    await allocation.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(200).send({
      status: "success",
      message: "Allocation reassigned successfully.",
      data: allocation,
    });
  } catch (error) {
    await session.abortTransaction();

    console.error("Reassign Allocation Failed:", error);

    return res.status(500).send({
      status: "failure",
      message: "Failed to reassign allocation.",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// export const confirmAllocation = async (req, res) => {
//   const { allocationId } = req.params;
//   const { vendorId } = req.body;

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Fetch the Allocation Transaction
//     const allocation = await AllocationModel.findById(allocationId).session(
//       session
//     );

//     if (!allocation) {
//       return res.status(404).send({
//         status: "failure",
//         message: `Allocation transaction with ID ${allocationId} not found.`,
//       });
//     }

//     // Ensure Allocation is in Draft status
//     if (allocation.status !== "Draft") {
//       return res.status(400).send({
//         status: "failure",
//         message: `Only Draft allocations can be confirmed.`,
//       });
//     }

//     // Validate Vendor
//     if (vendorId) {
//       const vendorExists = await VendorModel.findById(vendorId).session(
//         session
//       );
//       if (!vendorExists) {
//         return res.status(404).send({
//           status: "failure",
//           message: `Vendor with ID ${vendorId} does not exist.`,
//         });
//       }
//     }

//     // Update Allocation Status
//     allocation.vendor = vendorId;
//     allocation.status = "Confirmed";
//     await allocation.save({ session });

//     // Fetch the associated Sales Order
//     const salesOrder = await SalesOrderModel.findById(allocation.soId).session(
//       session
//     );

//     if (!salesOrder) {
//       throw new Error(`Sales order with ID ${allocation.soId} not found.`);
//     }

//     // Commit the session
//     await session.commitTransaction();

//     // Create the Purchase Order asynchronously
//     createPurchaseOrderAsync(allocation, vendorId);

//     return res.status(200).send({
//       status: "success",
//       message:
//         "Allocation confirmed successfully. Purchase Order creation in progress.",
//       data: allocation,
//     });
//   } catch (error) {
//     // Rollback the transaction
//     await session.abortTransaction();

//     // Log the failure
//     console.error("Allocation confirmation failed:", error);

//     // Update Allocation Status to Failed
//     await AllocationModel.findByIdAndUpdate(allocationId, {
//       status: "Failed",
//       failureReason: error.message,
//     });

//     return res.status(500).send({
//       status: "failure",
//       message: "Allocation confirmation failed.",
//       error: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };

// const createPurchaseOrderAsync = async (allocation, vendorId) => {
//   const lineAmt =
//     allocation.quantity * allocation.purchPrice +
//     allocation.purchCharges -
//     allocation.purchDiscount;

//   try {
//     const poData = {
//       vendor: vendorId,
//       currency: allocation.currency,
//       item: allocation.soId.item,
//       quantity: allocation.quantity,
//       price: allocation.purchPrice,
//       discount: allocation.purchDiscount,
//       charges: allocation.purchCharges,
//       lineAmt,
//       allocationId: allocation._id,
//       salesOrderId: allocation.soId,
//     };

//     // Save the Purchase Order
//     const purchaseOrder = new PurchaseOrderModel(poData);
//     await purchaseOrder.save();

//     // Update the allocation with the purchase order number
//     await AllocationModel.findByIdAndUpdate(
//       allocation._id,
//       { purchaseOrderNumber: purchaseOrder.orderNum },
//       { new: true }
//     );

//     console.log(
//       `Purchase Order ${purchaseOrder.orderNum} created successfully.`
//     );
//   } catch (error) {
//     console.error("Error creating Purchase Order asynchronously:", error);
//     try {
//       allocation.status = "Failed";
//       await allocation.save();
//       await retryAllocation(allocation._id);
//     } catch (error) {
//       console.log(
//         `Error while creating PO. Allocation back to Failed to push for retry. Check manually for this ${allocation._id}`
//       );
//     }

//     // Add PO creation error handling logic (e.g., retry mechanism or alerts)
//   }
// };

// export const retryAllocation1 = async (req, res) => {
//   const { allocationId } = req.params;

//   try {
//     const allocation = await AllocationModel.findById(allocationId);

//     if (!allocation) {
//       return res.status(404).send({
//         status: "failure",
//         message: `Allocation transaction with ID ${allocationId} not found.`,
//       });
//     }

//     if (allocation.status !== "Failed") {
//       return res.status(400).send({
//         status: "failure",
//         message: "Only failed allocations can be retried.",
//       });
//     }

//     // Reset status to Draft for retry
//     allocation.status = "Draft";
//     allocation.failureReason = null;
//     await allocation.save();

//     return res.status(200).send({
//       status: "success",
//       message: "Allocation reset for retry.",
//       data: allocation,
//     });
//   } catch (error) {
//     console.error("Retry allocation failed:", error);
//     try {
//       allocation.status = "Failed";
//       await allocation.save();
//     } catch (error) {
//       console.log(
//         `Allocation retries failed to perform and status back to failed`
//       );
//     }

//     return res.status(500).send({
//       status: "failure",
//       message: "Failed to retry allocation.",
//       error: error.message,
//     });
//   }
// };
