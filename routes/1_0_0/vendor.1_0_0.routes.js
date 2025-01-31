import express from "express";
import {
  createVendor,
  deleteAllVendors,
  deleteVendor,
  getVendor,
  getVendors,
  updateVendor,
} from "../../controllers/1_0_0/vendor.1_0_0.controller.js";

const vendorRouter = express.Router();

vendorRouter.post("/", createVendor);
vendorRouter.get("/", getVendors);
vendorRouter.get("/:vendorId", getVendor);
vendorRouter.put("/:vendorId", updateVendor);
vendorRouter.delete("/:vendorId", deleteVendor);
vendorRouter.delete("/", deleteAllVendors);

export { vendorRouter };
