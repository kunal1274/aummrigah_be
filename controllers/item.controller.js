import { ItemModel } from "../models/item.model.js";
import ce from "../utility/ce.js";
import cl from "../utility/cl.js";
import mongoose from "mongoose";

// Helper function for error logging
const logError = (context, error) => {
  console.error(`[${new Date().toISOString()}] ${context} - Error:`, {
    message: error.message || error,
    stack: error.stack,
  });
};

export const createItem = async (req, res) => {
  const itemBody = req.body;
  try {
    if (!itemBody.code) {
      return res.status(422).send({
        status: "failure",
        message: " Item code and Item Name are the required fields.",
      });
    }

    const dbResponseNewItem = await ItemModel.create(itemBody);
    // if (!dbResponseNewItem) {
    //   throw new Error({
    //     status: "failure",
    //     message: `There has been an error while creating the item master`,
    //   });
    // }
    cl(
      `Item master has been created successfully with id : ${
        dbResponseNewItem._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Item master has been created successfully with id : ${
        dbResponseNewItem._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewItem,
    });
  } catch (error) {
    // Database Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      logError("Item Creation - Validation Error", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during item creation.",
        error: error.message || error,
      });
    }

    // MongoDB Duplicate Key Error (e.g., email uniqueness constraint)
    if (error.code === 11000) {
      logError("item Creation - Duplicate Error", error);
      return res.status(409).send({
        status: "failure",
        message: "An item with the same code already exists.",
      });
    }

    // Handle MongoDB connection or network issues
    if (error.message.includes("network error")) {
      logError("Item Creation - Network Error", error);
      return res.status(503).send({
        status: "failure",
        message: "Service temporarily unavailable. Please try again later.",
      });
    }

    // General Server Error
    logError("Item Creation - Unknown Error", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred. Please try again.",
      error: error.message || error,
    });
  }
};

export const getItems = async (req, res) => {
  try {
    const dbResponse = await ItemModel.find({});
    return res.status(200).send({
      status: "success",
      message: " All the items has been fetched successfully",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    return res.status(400).send({
      status: "failure",
      message: " There is an error while trying to fetch all the items",
      error: error,
    });
  }
};

export const getItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const dbResponse = await ItemModel.findById(itemId);
    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `The item ${itemId} has been deleted or does not exist `,
      });
    }
    return res.status(200).send({
      status: "success",
      message: `The item record ${itemId} has been fetched successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    ce(`Error fetching item with ID ${itemId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `The error has been caught while fetching the item record `,
      error: error.message || error,
    });
  }
};

export const updateItem = async (request, response) => {
  const { itemId } = request.params;
  const itemBodyToUpdate = request.body;
  try {
    const dbResponse = await ItemModel.updateOne(
      { _id: itemId },
      { $set: itemBodyToUpdate }
    );
    return response.status(200).send({
      status: "success",
      message: `The item ${itemId} has been updated successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    return response.status(400).send({
      status: "failure",
      message: `There is an error while updating the item record ${itemId}`,
      error: error,
    });
  }
};

export const deleteItem = async (req, res) => {
  const { itemId } = req.params;
  try {
    const dbResponse = await ItemModel.findByIdAndDelete(itemId);
    return res.status(200).send({
      status: "success",
      message: `The item ${itemId} has been deleted successfully`,
      data: dbResponse,
    });
  } catch (error) {
    return res.status(400).send({
      status: "failure",
      message: `There has been error while deleting the item id ${itemId}`,
      error: error,
    });
  }
};
