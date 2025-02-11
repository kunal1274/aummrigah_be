import { PurchaseOrderModel } from "../models/purchaseorders.muuSHakaH.model.js";
import mongoose from "mongoose";
import { logError } from "../utility/logError.muuSHakaH.utils.js";
import { PurchaseOrderCounterModel } from "../models/counter.muuSHakaH.model.js";
import { VendorModel } from "../models/vendor.muuSHakaH.model.js";
import { ItemModel } from "../models/item.muuSHakaH.model.js";

export const createPurchaseOrder = async (req, res) => {
  const purchaseOrderBody = req.body;

  try {
    // Check for required fields
    if (!purchaseOrderBody.vendor || !purchaseOrderBody.item) {
      return res.status(422).send({
        status: "failure",
        message: "Vendor and Item are required fields.",
      });
    }

    // Validate existence of the vendor
    const vendorExists = await VendorModel.findById(purchaseOrderBody.vendor);
    if (!vendorExists) {
      return res.status(404).send({
        status: "failure",
        message: `Vendor with ID ${purchaseOrderBody.vendor} does not exist.`,
      });
    }

    // Validate existence of the item
    const itemExists = await ItemModel.findById(purchaseOrderBody.item);
    if (!itemExists) {
      return res.status(404).send({
        status: "failure",
        message: `Item with ID ${purchaseOrderBody.item} does not exist.`,
      });
    }

    // Create Purchase Order
    const dbResponseNewPurchaseOrder = await PurchaseOrderModel.create(
      purchaseOrderBody
    );

    console.log(
      `Purchase order has been created successfully with id: ${
        dbResponseNewPurchaseOrder._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Purchase order has been created successfully with id: ${
        dbResponseNewPurchaseOrder._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewPurchaseOrder,
    });
  } catch (error) {
    // Database Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      logError("Purchase Order Creation - Validation Error", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during purchase order creation.",
        error: error.message || error,
      });
    }

    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      logError("Purchase Order Creation - Duplicate Error", error);
      return res.status(409).send({
        status: "failure",
        message: "A purchase order with the same order number already exists.",
      });
    }

    // Handle MongoDB connection or network issues
    if (error.message.includes("network error")) {
      logError("Purchase Order Creation - Network Error", error);
      return res.status(503).send({
        status: "failure",
        message: "Service temporarily unavailable. Please try again later.",
      });
    }

    // General Server Error
    logError("Purchase Order Creation - Unknown Error", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred. Please try again.",
      error: error.message || error,
    });
  }
};

export const getPurchaseOrderById = async (req, res) => {
  const { purchaseOrderId } = req.params;

  try {
    // Use populate to fetch vendor and item details
    const purchaseOrder = await PurchaseOrderModel.findById(purchaseOrderId)
      .populate("vendor", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!purchaseOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Purchase order with ID ${purchaseOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Purchase order retrieved successfully.",
      data: purchaseOrder,
    });
  } catch (error) {
    logError("Get Purchase Order By ID", error);
    return res.status(500).send({
      status: "failure",
      message: `Error retrieving purchase order with ID ${purchaseOrderId}.`,
      error: error.message,
    });
  }
};

export const getAllPurchaseOrders = async (req, res) => {
  try {
    // Retrieve all purchase orders with vendor and item details populated
    const purchaseOrders = await PurchaseOrderModel.find()
      .populate("vendor", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!purchaseOrders || purchaseOrders.length === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No purchase orders found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Purchase orders retrieved successfully.",
      count: purchaseOrders.length,
      data: purchaseOrders,
    });
  } catch (error) {
    logError("Get All Purchase Orders", error);
    return res.status(500).send({
      status: "failure",
      message: "Error retrieving purchase orders.",
      error: error.message,
    });
  }
};

export const updatePurchaseOrderById = async (req, res) => {
  const { purchaseOrderId } = req.params;
  const updatedData = req.body;

  try {
    // Check for required fields
    if (!updatedData.vendor || !updatedData.item) {
      return res.status(422).send({
        status: "failure",
        message: "Vendor and Item are required fields.",
      });
    }

    const updatedPurchaseOrder = await PurchaseOrderModel.findByIdAndUpdate(
      purchaseOrderId,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate("vendor", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!updatedPurchaseOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Purchase order with ID ${purchaseOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Purchase order updated successfully.",
      data: updatedPurchaseOrder,
    });
  } catch (error) {
    logError("Update Purchase Order By ID", error);

    // Validation Error Handling
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(422).send({
        status: "failure",
        message: "Validation error during purchase order update.",
        error: error.message,
      });
    }

    return res.status(500).send({
      status: "failure",
      message: `Error updating purchase order with ID ${purchaseOrderId}.`,
      error: error.message,
    });
  }
};

export const deletePurchaseOrderById = async (req, res) => {
  const { purchaseOrderId } = req.params;

  try {
    const deletedPurchaseOrder = await PurchaseOrderModel.findByIdAndDelete(
      purchaseOrderId
    );

    if (!deletedPurchaseOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Purchase order with ID ${purchaseOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `Purchase order with ID ${purchaseOrderId} deleted successfully.`,
      data: deletedPurchaseOrder,
    });
  } catch (error) {
    logError("Delete Purchase Order By ID", error);
    return res.status(500).send({
      status: "failure",
      message: `Error deleting purchase order with ID ${purchaseOrderId}.`,
      error: error.message,
    });
  }
};

export const deleteAllPurchaseOrders = async (req, res) => {
  try {
    const deletedResponse = await PurchaseOrderModel.deleteMany({});

    const resetCounter = await PurchaseOrderCounterModel.findOneAndUpdate(
      { _id: "purchaseOrderCode" },
      { seq: 0 }, // Reset sequence to 0
      { new: true, upsert: true } // Create document if it doesn't exist
    );

    if (deletedResponse.deletedCount === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No purchase orders found to delete.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: `${deletedResponse.deletedCount} purchase orders deleted successfully.`,
      data: {
        deletedCount: deletedResponse.deletedCount,
        counter: resetCounter,
      },
    });
  } catch (error) {
    logError("Delete All Purchase Orders", error);
    return res.status(500).send({
      status: "failure",
      message: "Error deleting all purchase orders.",
      error: error.message,
    });
  }
};
