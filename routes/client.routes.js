import express from "express";

import {
  addFeature,
  createClient,
  deleteClientById,
  getAllClients,
  getClientById,
  removeFeature,
  toggleFeature,
  updateClientById,
} from "../controllers/client.controller.js";

const clientRouter = express.Router();

clientRouter.post("/", createClient);
clientRouter.get("/", getAllClients);
clientRouter.get("/:clientId", getClientById);
clientRouter.put("/:clientId", updateClientById);
clientRouter.delete("/:clientId", deleteClientById);
//clientRouter.delete("/", deleteAllCustomers);

// features
// Feature operations
clientRouter.patch("/:clientId/features", toggleFeature);
clientRouter.patch("/:clientId/features/add", addFeature);
clientRouter.delete("/:clientId/features/:featureKey", removeFeature);

export { clientRouter };
