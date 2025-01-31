import express from "express";
import { upload } from "../middleware/uploadConfig.muuSHakaH.mw.js";
import {
  createSoftAllocation,
  confirmAllocation,
  reassignAllocation,
  retryAllocation,
  handleVendorRejection,
  getAllAllocations,
  updateAllocation,
  updateRideStatus,
} from "../controllers/allocation.muuSHakaH.controller.js";

const allocationRouter = express.Router();

allocationRouter.get("/", getAllAllocations);
allocationRouter.post("/", createSoftAllocation);

allocationRouter.post("/:allocationId/confirm", confirmAllocation);
allocationRouter.post("/:allocationId/retry", retryAllocation);
allocationRouter.put("/:allocationId/reject", handleVendorRejection);
allocationRouter.put("/:allocationId/reassign", reassignAllocation);
allocationRouter.patch("/:allocationId/ridestatus", updateRideStatus);
allocationRouter.patch("/:allocationId", updateAllocation);

// // Upload files for an item
// itemRouter.post(
//   "/:salesOrderId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { allocationRouter };
