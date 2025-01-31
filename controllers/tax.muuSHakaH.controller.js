import { TaxModel } from "../models/tax.muuSHakaH.model.js";
import mongoose from "mongoose";
import {
  winstonLogger,
  logError,
} from "../utility/logError.muuSHakaH.utils.js";
import { TaxCounterModel } from "../models/counter.muuSHakaH.model.js";

export const createTax = async (req, res) => {
  const taxBody = req.body;

  try {
    // Validation
    if (!taxBody.taxNum || !taxBody.name) {
      return res.status(422).send({
        status: "failure",
        message: "Tax Number and Name are required fields.",
      });
    }

    // Create Tax Record
    const dbResponseNewTax = await TaxModel.create(taxBody);

    console.log(
      `Tax record created successfully with id: ${
        dbResponseNewTax._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`
    );

    return res.status(201).send({
      status: "success",
      message: `Tax record created successfully with id: ${
        dbResponseNewTax._id
      } at ${new Date().toISOString()} equivalent to IST ${new Date().toLocaleString(
        "en-US",
        { timeZone: "Asia/Kolkata" }
      )}`,
      data: dbResponseNewTax,
    });
  } catch (error) {
    // Validation Error
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation Error during Tax creation:", error);
      return res.status(422).send({
        status: "failure",
        message: "Validation error during tax creation.",
        error: error.message || error,
      });
    }

    // Duplicate Key Error
    if (error.code === 11000) {
      console.error("Duplicate Key Error during Tax creation:", error);
      return res.status(409).send({
        status: "failure",
        message: "A tax record with the same Tax Number already exists.",
      });
    }

    // General Error
    console.error("Unknown Error during Tax creation:", error);
    return res.status(500).send({
      status: "failure",
      message: "An unexpected error occurred during tax creation.",
      error: error.message || error,
    });
  }
};

export const getTaxes = async (req, res) => {
  try {
    const dbResponse = await TaxModel.find({});
    return res.status(200).send({
      status: "success",
      message: "All tax records have been fetched successfully.",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    console.error("Error fetching all taxes:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while fetching all tax records.",
      error: error.message || error,
    });
  }
};

export const getTax = async (req, res) => {
  const { taxId } = req.params;

  try {
    const dbResponse = await TaxModel.findById(taxId);

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `The tax record with ID ${taxId} does not exist.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The tax record with ID ${taxId} has been fetched successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error fetching tax record with ID ${taxId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while fetching the tax record with ID ${taxId}.`,
      error: error.message || error,
    });
  }
};

export const updateTax = async (req, res) => {
  const { taxId } = req.params;
  const taxBodyToUpdate = req.body;

  try {
    const taxExists = await TaxModel.findById(taxId);
    if (!taxExists) {
      return res.status(404).send({
        status: "failure",
        message: `The tax record with ID ${taxId} does not exist.`,
      });
    }

    const dbResponse = await TaxModel.updateOne(
      { _id: taxId },
      { $set: taxBodyToUpdate }
    );

    return res.status(200).send({
      status: "success",
      message: `The tax record with ID ${taxId} has been updated successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error updating tax record with ID ${taxId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while updating the tax record with ID ${taxId}.`,
      error: error.message || error,
    });
  }
};

export const deleteTax = async (req, res) => {
  const { taxId } = req.params;

  try {
    const dbResponse = await TaxModel.findByIdAndDelete(taxId);

    if (!dbResponse) {
      return res.status(404).send({
        status: "failure",
        message: `No tax record found with ID ${taxId}.`,
      });
    }

    return res.status(200).send({
      status: "success",
      message: `The tax record with ID ${taxId} has been deleted successfully.`,
      data: dbResponse,
    });
  } catch (error) {
    console.error(`Error deleting tax record with ID ${taxId}:`, error);
    return res.status(500).send({
      status: "failure",
      message: `An error occurred while deleting the tax record with ID ${taxId}.`,
      error: error.message || error,
    });
  }
};

export const deleteAllTaxes = async (req, res) => {
  try {
    const deleteResponse = await TaxModel.deleteMany({});
    console.log(`Deleted ${deleteResponse.deletedCount} tax records.`);

    // Reset the counter for item code
    const resetCounter = await TaxCounterModel.findOneAndUpdate(
      { _id: "taxCode" },
      { seq: 0 }, // Reset sequence to 0
      { new: true, upsert: true } // Create document if it doesn't exist
    );

    return res.status(200).send({
      status: "success",
      message: "All tax records have been deleted successfully.",
      data: {
        deletedCount: deleteResponse.deletedCount,
        counter: resetCounter,
      },
    });
  } catch (error) {
    console.error("Error deleting all tax records:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while deleting all tax records.",
      error: error.message || error,
    });
  }
};
