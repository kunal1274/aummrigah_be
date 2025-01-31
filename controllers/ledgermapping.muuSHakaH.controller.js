import mongoose from "mongoose";
import { LedgerMappingModel } from "../models/ledgermapping.muuSHakaH.model.js"; // Adjust path as per your project
import { logError } from "../utility/logError.muuSHakaH.utils.js"; // Replace with your actual logging utilities
import { LedgerMappingCounterModel } from "../models/counter.muuSHakaH.model.js";
import cl from "../utility/cl.muuSHakaH.utils.js";

export const createLedgerMapping = async (req, res) => {
  const ledgerMappingBody = req.body;

  try {
    // Basic Validation
    if (!ledgerMappingBody.ledgerMappingNum || !ledgerMappingBody.name) {
      return res.status(422).send({
        status: "failure",
        message: "Ledger Mapping Number and Name are required fields.",
      });
    }

    // Create Ledger Mapping
    const dbResponseNewLedgerMapping = await LedgerMappingModel.create(
      ledgerMappingBody
    );

    cl(
      `Ledger mapping created successfully with id: ${
        dbResponseNewLedgerMapping._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Ledger mapping created successfully with id: ${
        dbResponseNewLedgerMapping._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewLedgerMapping,
    });
  } catch (error) {
    // Handle Mongoose Validation Errors
    if (error instanceof mongoose.Error.ValidationError) {
      logError("Ledger Mapping Creation - Validation Error", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during ledger mapping creation.",
        error: error.message || error,
      });
    }

    // Handle Duplicate Key Errors (e.g., unique constraints)
    if (error.code === 11000) {
      logError("Ledger Mapping Creation - Duplicate Error", error);
      return res.status(409).send({
        status: "failure",
        message: "A ledger mapping with the same number already exists.",
      });
    }

    // Handle MongoDB Connection or Network Issues
    if (error.message.includes("network error")) {
      logError("Ledger Mapping Creation - Network Error", error);
      return res.status(503).send({
        status: "failure",
        message: "Service temporarily unavailable. Please try again later.",
      });
    }

    // General Server Error
    logError("Ledger Mapping Creation - Unknown Error", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred. Please try again.",
      error: error.message || error,
    });
  }
};

export const getLedgerMappings = async (req, res) => {
  try {
    const dbResponse = await LedgerMappingModel.find({});
    return res.status(200).send({
      status: "success",
      message: "All the ledger mappings have been fetched successfully.",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    return res.status(400).send({
      status: "failure",
      message:
        "There was an error while trying to fetch all the ledger mappings.",
      error: error.message || error,
    });
  }
};

export const getLedgerMapping = async (req, res) => {
  const { ledgerMappingId } = req.params;
  try {
    const dbResponse = await LedgerMappingModel.findById(ledgerMappingId);
    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `The ledger mapping with ID ${ledgerMappingId} has been deleted or does not exist.`,
      });
    }
    return res.status(200).send({
      status: "success",
      message: `The ledger mapping with ID ${ledgerMappingId} has been fetched successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    ce(`Error fetching ledger mapping with ID ${ledgerMappingId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: "There was an error while fetching the ledger mapping record.",
      error: error.message || error,
    });
  }
};

export const updateLedgerMapping = async (req, res) => {
  const { ledgerMappingId } = req.params;
  const ledgerMappingBodyToUpdate = req.body;

  try {
    // Check if the Ledger Mapping exists
    const ledgerMappingExists = await LedgerMappingModel.findById(
      ledgerMappingId
    );
    if (!ledgerMappingExists) {
      return res.status(404).send({
        status: "failure",
        message: `The ledger mapping with ID ${ledgerMappingId} does not exist or has been deleted.`,
      });
    }

    // Update the Ledger Mapping
    const dbResponse = await LedgerMappingModel.updateOne(
      { _id: ledgerMappingId },
      { $set: ledgerMappingBodyToUpdate }
    );

    return res.status(200).send({
      status: "success",
      message: `The ledger mapping with ID ${ledgerMappingId} has been updated successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(
      `Error updating ledger mapping with ID ${ledgerMappingId}:`,
      error
    );
    return res.status(400).send({
      status: "failure",
      message: `There was an error while updating the ledger mapping with ID ${ledgerMappingId}.`,
      error: error.message,
    });
  }
};

export const deleteLedgerMapping = async (req, res) => {
  const { ledgerMappingId } = req.params;

  try {
    // Delete the Ledger Mapping
    const dbResponse = await LedgerMappingModel.findByIdAndDelete(
      ledgerMappingId
    );

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `No ledger mapping found with ID ${ledgerMappingId}.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The ledger mapping with ID ${ledgerMappingId} has been deleted successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(
      `Error deleting ledger mapping with ID ${ledgerMappingId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: `There was an error while deleting the ledger mapping with ID ${ledgerMappingId}.`,
      error: error.message,
    });
  }
};

export const deleteAllLedgerMappings = async (req, res) => {
  try {
    // Delete all Ledger Mappings
    const deleteResponse = await LedgerMappingModel.deleteMany({});
    console.log(`Deleted ${deleteResponse.deletedCount} ledger mappings.`);

    // Reset the counter for ledger mapping code
    const resetCounter = await LedgerMappingCounterModel.findOneAndUpdate(
      { _id: "ledgerMappingCode" },
      { seq: 0 }, // Reset sequence to 0
      { new: true, upsert: true } // Create document if it doesn't exist
    );

    return res.status(200).send({
      status: "success",
      message:
        "All ledger mappings have been deleted, and the sequence has been reset to 1.",
      data: {
        deletedCount: deleteResponse.deletedCount,
        counter: resetCounter,
      },
    });
  } catch (error) {
    console.error(
      "Error while deleting all ledger mappings and resetting sequence:",
      error
    );
    return res.status(500).send({
      status: "failure",
      message:
        "Error while deleting all ledger mappings or resetting the sequence.",
      error: error.message,
    });
  }
};
