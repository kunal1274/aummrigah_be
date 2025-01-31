import { ClientModel } from "../models/client.muuSHakaH.model.js";
import {
  logError,
  winstonLogger,
} from "../utility/logError.muuSHakaH.utils.js";
import mongoose from "mongoose";

// Create a new client
export const createClient = async (req, res) => {
  try {
    const newClient = new ClientModel(req.body);
    const savedClient = await newClient.save();

    winstonLogger.info(`Client created: ${savedClient.name}`);
    res.status(201).send({
      status: "success",
      message: "Client created successfully.",
      data: savedClient,
    });
  } catch (error) {
    logError("Create Client", error);
    res.status(500).send({
      status: "failure",
      message: "Error creating client.",
      error: error.message,
    });
  }
};

// Get all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await ClientModel.find({});
    res.status(200).send({
      status: "success",
      message: "Clients retrieved successfully.",
      data: clients,
    });
  } catch (error) {
    logError("Get All Clients", error);
    res.status(500).send({
      status: "failure",
      message: "Error retrieving clients.",
      error: error.message,
    });
  }
};

// Get a single client by ID
export const getClientById = async (req, res) => {
  const { clientId } = req.params;
  try {
    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }
    res.status(200).send({
      status: "success",
      message: "Client retrieved successfully.",
      data: client,
    });
  } catch (error) {
    logError("Get Client By ID", error);
    res.status(500).send({
      status: "failure",
      message: `Error retrieving client with ID ${clientId}.`,
      error: error.message,
    });
  }
};

// Update a client by ID
export const updateClientById = async (req, res) => {
  const { clientId } = req.params;
  try {
    const updatedClient = await ClientModel.findByIdAndUpdate(
      clientId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedClient) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }
    winstonLogger.info(`Client updated: ${updatedClient.name}`);
    res.status(200).send({
      status: "success",
      message: "Client updated successfully.",
      data: updatedClient,
    });
  } catch (error) {
    logError("Update Client By ID", error);
    res.status(500).send({
      status: "failure",
      message: `Error updating client with ID ${clientId}.`,
      error: error.message,
    });
  }
};

// Delete a client by ID
export const deleteClientById = async (req, res) => {
  const { clientId } = req.params;
  try {
    const deletedClient = await ClientModel.findByIdAndDelete(clientId);
    if (!deletedClient) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }
    winstonLogger.info(`Client deleted: ${deletedClient.name}`);
    res.status(200).send({
      status: "success",
      message: "Client deleted successfully.",
      data: deletedClient,
    });
  } catch (error) {
    logError("Delete Client By ID", error);
    res.status(500).send({
      status: "failure",
      message: `Error deleting client with ID ${clientId}.`,
      error: error.message,
    });
  }
};

/// features

// Toggle a feature for a client
export const toggleFeature = async (req, res) => {
  const { clientId } = req.params;
  const { featureKey } = req.body;

  try {
    // Find the client
    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }

    // Toggle the feature value
    const currentFeatureValue = client.features.get(featureKey) || false;
    client.features.set(featureKey, !currentFeatureValue);
    await client.save();

    winstonLogger.info(
      `Feature '${featureKey}' toggled to ${!currentFeatureValue} for client ${
        client.name
      }`
    );
    res.status(200).send({
      status: "success",
      message: `Feature '${featureKey}' updated successfully.`,
      data: client,
    });
  } catch (error) {
    logError("Toggle Feature", error);
    res.status(500).send({
      status: "failure",
      message: "Error toggling feature.",
      error: error.message,
    });
  }
};

// Add a new feature to a client
export const addFeature = async (req, res) => {
  const { clientId } = req.params;
  const { featureKey, value } = req.body;

  if (!featureKey) {
    return res.status(400).send({
      status: "failure",
      message: "Feature key is required.",
    });
  }

  try {
    // Find the client
    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }

    // Add or update the feature
    client.features.set(featureKey, value || false);
    await client.save();

    winstonLogger.info(
      `Feature '${featureKey}' added with value ${value || false} for client ${
        client.name
      }`
    );
    res.status(200).send({
      status: "success",
      message: `Feature '${featureKey}' added successfully.`,
      data: client,
    });
  } catch (error) {
    logError("Add Feature", error);
    res.status(500).send({
      status: "failure",
      message: "Error adding feature.",
      error: error.message,
    });
  }
};

// Remove a feature from a client
export const removeFeature = async (req, res) => {
  const { clientId, featureKey } = req.params;

  try {
    // Find the client
    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).send({
        status: "failure",
        message: `Client with ID ${clientId} not found.`,
      });
    }

    // Remove the feature
    if (client.features.has(featureKey)) {
      client.features.delete(featureKey);
      await client.save();

      winstonLogger.info(
        `Feature '${featureKey}' removed from client ${client.name}`
      );
      return res.status(200).send({
        status: "success",
        message: `Feature '${featureKey}' removed successfully.`,
        data: client,
      });
    } else {
      return res.status(404).send({
        status: "failure",
        message: `Feature '${featureKey}' not found for client ${client.name}.`,
      });
    }
  } catch (error) {
    logError("Remove Feature", error);
    res.status(500).send({
      status: "failure",
      message: "Error removing feature.",
      error: error.message,
    });
  }
};
