import { LedgerAccountCounterModel } from "../models/counter.muuSHakaH.model.js";
import { LedgerAccountModel } from "../models/ledger.muuSHakaH.model.js";
import {
  logError,
  winstonLogger,
} from "../utility/logError.muuSHakaH.utils.js";
import mongoose from "mongoose";

export const createLedgerAccount = async (req, res) => {
  const ledgerAccountBody = req.body;

  try {
    // Validation
    if (!ledgerAccountBody.ledgerAccountNum || !ledgerAccountBody.name) {
      return res.status(422).send({
        status: "failure",
        message: "Ledger Account Number and Name are required fields.",
      });
    }

    // Create Ledger Account Record
    const dbResponseNewLedgerAccount = await LedgerAccountModel.create(
      ledgerAccountBody
    );

    console.log(
      `Ledger account created successfully with id: ${
        dbResponseNewLedgerAccount._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Ledger account created successfully with id: ${
        dbResponseNewLedgerAccount._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewLedgerAccount,
    });
  } catch (error) {
    // Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation Error during Ledger Account creation:", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during ledger account creation.",
        error: error.message || error,
      });
    }

    // Duplicate Key Error
    if (error.code === 11000) {
      console.error(
        "Duplicate Key Error during Ledger Account creation:",
        error
      );
      return res.status(409).send({
        status: "failure",
        message:
          "A ledger account with the same Account Number already exists.",
      });
    }

    // General Error
    console.error("Unknown Error during Ledger Account creation:", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred during ledger account creation.",
      error: error.message || error,
    });
  }
};

export const getLedgerAccounts = async (req, res) => {
  try {
    const dbResponse = await LedgerAccountModel.find({});
    return res.status(200).send({
      status: "success",
      message: "All ledger accounts have been fetched successfully.",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    console.error("Error fetching all ledger accounts:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while fetching all ledger accounts.",
      error: error.message || error,
    });
  }
};

export const getLedgerAccount = async (req, res) => {
  const { ledgerAccountId } = req.params;

  try {
    const dbResponse = await LedgerAccountModel.findById(ledgerAccountId);

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `The ledger account with ID ${ledgerAccountId} does not exist.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The ledger account with ID ${ledgerAccountId} has been fetched successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(
      `Error fetching ledger account with ID ${ledgerAccountId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while fetching the ledger account with ID ${ledgerAccountId}.`,
      error: error.message || error,
    });
  }
};

export const updateLedgerAccount = async (req, res) => {
  const { ledgerAccountId } = req.params;
  const ledgerAccountBodyToUpdate = req.body;

  try {
    const ledgerAccountExists = await LedgerAccountModel.findById(
      ledgerAccountId
    );
    if (!ledgerAccountExists) {
      return res.status(404).send({
        status: "failure",
        message: `The ledger account with ID ${ledgerAccountId} does not exist.`,
      });
    }

    const dbResponse = await LedgerAccountModel.updateOne(
      { _id: ledgerAccountId },
      { $set: ledgerAccountBodyToUpdate }
    );

    return res.status(200).send({
      status: "success",
      message: `The ledger account with ID ${ledgerAccountId} has been updated successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(
      `Error updating ledger account with ID ${ledgerAccountId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while updating the ledger account with ID ${ledgerAccountId}.`,
      error: error.message || error,
    });
  }
};

export const deleteLedgerAccount = async (req, res) => {
  const { ledgerAccountId } = req.params;

  try {
    const dbResponse = await LedgerAccountModel.findByIdAndDelete(
      ledgerAccountId
    );

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `No ledger account found with ID ${ledgerAccountId}.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The ledger account with ID ${ledgerAccountId} has been deleted successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(
      `Error deleting ledger account with ID ${ledgerAccountId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while deleting the ledger account with ID ${ledgerAccountId}.`,
      error: error.message || error,
    });
  }
};

export const deleteAllLedgerAccounts = async (req, res) => {
  try {
    const deleteResponse = await LedgerAccountModel.deleteMany({});
    console.log(`Deleted ${deleteResponse.deletedCount} ledger accounts.`);

    // Reset the counter for item code
    const resetCounter = await LedgerAccountCounterModel.findOneAndUpdate(
      { _id: "ledgerAccountCode" },
      { seq: 0 }, // Reset sequence to 0
      { new: true, upsert: true } // Create document if it doesn't exist
    );

    return res.status(200).send({
      status: "success",
      message: "All ledger accounts have been deleted successfully.",
      data: {
        deletedCount: deleteResponse.deletedCount,
        counter: resetCounter,
      },
    });
  } catch (error) {
    console.error("Error deleting all ledger accounts:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while deleting all ledger accounts.",
      error: error.message || error,
    });
  }
};
