import { BankModel } from "../models/bank.muuSHakaH.model.js";
import { BankCounterModel } from "../models/counter.muuSHakaH.model.js";
import {
  logError,
  winstonLogger,
} from "../utility/logError.muuSHakaH.utils.js";
import mongoose from "mongoose";

export const createBank = async (req, res) => {
  const bankBody = req.body;

  try {
    // Validation
    if (!bankBody.bankNum || !bankBody.name) {
      return res.status(422).send({
        status: "failure",
        message: "Bank Number and Name are required fields.",
      });
    }

    // Create Bank Record
    const dbResponseNewBank = await BankModel.create(bankBody);

    console.log(
      `Bank record created successfully with id: ${
        dbResponseNewBank._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Bank record created successfully with id: ${
        dbResponseNewBank._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewBank,
    });
  } catch (error) {
    // Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation Error during Bank creation:", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during bank creation.",
        error: error.message || error,
      });
    }

    // Duplicate Key Error
    if (error.code === 11000) {
      console.error("Duplicate Key Error during Bank creation:", error);
      return res.status(409).send({
        status: "failure",
        message: "A bank record with the same Bank Number already exists.",
      });
    }

    // General Error
    console.error("Unknown Error during Bank creation:", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred during bank creation.",
      error: error.message || error,
    });
  }
};

export const getBanks = async (req, res) => {
  try {
    const dbResponse = await BankModel.find({});
    return res.status(200).send({
      status: "success",
      message: "All bank records have been fetched successfully.",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    console.error("Error fetching all banks:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while fetching all bank records.",
      error: error.message || error,
    });
  }
};

export const getBank = async (req, res) => {
  const { bankId } = req.params;

  try {
    const dbResponse = await BankModel.findById(bankId);

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `The bank record with ID ${bankId} does not exist.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The bank record with ID ${bankId} has been fetched successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error fetching bank record with ID ${bankId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while fetching the bank record with ID ${bankId}.`,
      error: error.message || error,
    });
  }
};

export const updateBank = async (req, res) => {
  const { bankId } = req.params;
  const bankBodyToUpdate = req.body;

  try {
    const bankExists = await BankModel.findById(bankId);
    if (!bankExists) {
      return res.status(404).send({
        status: "failure",
        message: `The bank record with ID ${bankId} does not exist.`,
      });
    }

    const dbResponse = await BankModel.updateOne(
      { _id: bankId },
      { $set: bankBodyToUpdate }
    );

    return res.status(200).send({
      status: "success",
      message: `The bank record with ID ${bankId} has been updated successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error updating bank record with ID ${bankId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while updating the bank record with ID ${bankId}.`,
      error: error.message || error,
    });
  }
};

export const deleteBank = async (req, res) => {
  const { bankId } = req.params;

  try {
    const dbResponse = await BankModel.findByIdAndDelete(bankId);

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `No bank record found with ID ${bankId}.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The bank record with ID ${bankId} has been deleted successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error deleting bank record with ID ${bankId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while deleting the bank record with ID ${bankId}.`,
      error: error.message || error,
    });
  }
};

export const deleteAllBanks = async (req, res) => {
  try {
    const deleteResponse = await BankModel.deleteMany({});
    console.log(`Deleted ${deleteResponse.deletedCount} bank records.`);

    // Reset the counter for item code
    const resetCounter = await BankCounterModel.findOneAndUpdate(
      { _id: "ledgerAccountCode" },
      { seq: 0 }, // Reset sequence to 0
      { new: true, upsert: true } // Create document if it doesn't exist
    );

    return res.status(200).send({
      status: "success",
      message: "All bank records have been deleted successfully.",
      data: {
        deletedCount: deleteResponse.deletedCount,
        counter: resetCounter,
      },
    });
  } catch (error) {
    console.error("Error deleting all bank records:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while deleting all bank records.",
      error: error.message || error,
    });
  }
};
