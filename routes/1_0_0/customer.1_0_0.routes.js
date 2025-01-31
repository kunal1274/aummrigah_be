import express from "express";
import {
  createCustomer,
  deleteAllCustomers,
  deleteCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from "../../controllers/1_0_0/customer.1_0_0.controller.js";

const customerRouter = express.Router();

customerRouter.post("/", createCustomer);
customerRouter.get("/", getCustomers);
customerRouter.get("/:customerId", getCustomer);
customerRouter.put("/:customerId", updateCustomer);
customerRouter.delete("/:customerId", deleteCustomer);
customerRouter.delete("/", deleteAllCustomers);

export { customerRouter };
