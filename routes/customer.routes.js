import express from "express";
import {
  createCustomer,
  getCustomers,
} from "../controllers/customer.controller.js";

const customerRouter = express.Router();

customerRouter.post("/", createCustomer);
customerRouter.get("/", getCustomers);

export { customerRouter };
