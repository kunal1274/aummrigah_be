import { SalesOrderModel } from "../models/salesOrder.model.js";
import mongoose from "mongoose";
import { logError } from "../utility/logError.js";

export const createSalesOrder = async (req, res) => {
  const salesOrderBody = req.body;

  try {
    // Check for required fields
    if (!salesOrderBody.customer || !salesOrderBody.item) {
      return res.status(422).send({
        status: "failure",
        message: "Customer and Item are required fields.",
      });
    }

    // Create Sales Order
    const dbResponseNewSalesOrder = await SalesOrderModel.create(
      salesOrderBody
    );

    console.log(
      `Sales order has been created successfully with id: ${
        dbResponseNewSalesOrder._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Sales order has been created successfully with id: ${
        dbResponseNewSalesOrder._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewSalesOrder,
    });
  } catch (error) {
    // Database Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      logError("Sales Order Creation - Validation Error", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during sales order creation.",
        error: error.message || error,
      });
    }

    // MongoDB Duplicate Key Error
    if (error.code === 11000) {
      logError("Sales Order Creation - Duplicate Error", error);
      return res.status(409).send({
        status: "failure",
        message: "A sales order with the same order number already exists.",
      });
    }

    // Handle MongoDB connection or network issues
    if (error.message.includes("network error")) {
      logError("Sales Order Creation - Network Error", error);
      return res.status(503).send({
        status: "failure",
        message: "Service temporarily unavailable. Please try again later.",
      });
    }

    // General Server Error
    logError("Sales Order Creation - Unknown Error", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred. Please try again.",
      error: error.message || error,
    });
  }
};

export const getSalesOrderById = async (req, res) => {
  const { salesOrderId } = req.params;

  try {
    // Use populate to fetch customer and item details
    const salesOrder = await SalesOrderModel.findById(salesOrderId)
      .populate("customer", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!salesOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Sales order with ID ${salesOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales order retrieved successfully.",
      data: salesOrder,
    });
  } catch (error) {
    logError("Get Sales Order By ID", error);
    return res.status(500).send({
      status: "failure",
      message: `Error retrieving sales order with ID ${salesOrderId}.`,
      error: error.message,
    });
  }
};

export const getAllSalesOrders = async (req, res) => {
  try {
    // Retrieve all sales orders with customer and item details populated
    const salesOrders = await SalesOrderModel.find()
      .populate("customer", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!salesOrders || salesOrders.length === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No sales orders found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales orders retrieved successfully.",
      data: salesOrders,
    });
  } catch (error) {
    logError("Get All Sales Orders", error);
    return res.status(500).send({
      status: "failure",
      message: "Error retrieving sales orders.",
      error: error.message,
    });
  }
};

export const updateSalesOrderById = async (req, res) => {
  const { salesOrderId } = req.params;
  const updatedData = req.body;

  try {
    const updatedSalesOrder = await SalesOrderModel.findByIdAndUpdate(
      salesOrderId,
      updatedData,
      { new: true, runValidators: true }
    )
      .populate("customer", "name contactNum address")
      .populate("item", "name description price type unit");

    if (!updatedSalesOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Sales order with ID ${salesOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales order updated successfully.",
      data: updatedSalesOrder,
    });
  } catch (error) {
    logError("Update Sales Order By ID", error);

    // Validation Error Handling
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(422).send({
        status: "failure",
        message: "Validation error during sales order update.",
        error: error.message,
      });
    }

    return res.status(500).send({
      status: "failure",
      message: `Error updating sales order with ID ${salesOrderId}.`,
      error: error.message,
    });
  }
};

export const deleteSalesOrderById = async (req, res) => {
  const { salesOrderId } = req.params;

  try {
    const deletedSalesOrder = await SalesOrderModel.findByIdAndDelete(
      salesOrderId
    );

    if (!deletedSalesOrder) {
      return res.status(404).send({
        status: "failure",
        message: `Sales order with ID ${salesOrderId} not found.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `Sales order with ID ${salesOrderId} deleted successfully.`,
      data: deletedSalesOrder,
    });
  } catch (error) {
    logError("Delete Sales Order By ID", error);
    return res.status(500).send({
      status: "failure",
      message: `Error deleting sales order with ID ${salesOrderId}.`,
      error: error.message,
    });
  }
};

export const deleteAllSalesOrders = async (req, res) => {
  try {
    const deletedCount = await SalesOrderModel.deleteMany({});

    if (deletedCount.deletedCount === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No sales orders found to delete.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: `${deletedCount.deletedCount} sales orders deleted successfully.`,
    });
  } catch (error) {
    logError("Delete All Sales Orders", error);
    return res.status(500).send({
      status: "failure",
      message: "Error deleting all sales orders.",
      error: error.message,
    });
  }
};
