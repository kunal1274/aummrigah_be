import express from "express";
import {
  createVendor,
  deleteAllVendors,
  deleteVendor,
  getVendor,
  getVendors,
  updateVendor,
} from "../controllers/vendor.muuSHakaH.controller.js";

const vendorRouter = express.Router();

vendorRouter.post("/", createVendor);
vendorRouter.get("/", getVendors);
vendorRouter.get("/:vendorId", getVendor);
vendorRouter.put("/:vendorId", updateVendor);
vendorRouter.delete("/:vendorId", deleteVendor);
vendorRouter.delete("/", deleteAllVendors);

export { vendorRouter };
