import expressSO from "express";
import { upload } from "../middleware/uploadConfig.muuSHakaH.mw.js";
import {
  patchSalesOrderById,
  createSalesOrder,
  deleteAllSalesOrders,
  deleteDraftSalesOrders,
  deleteSalesOrderById,
  getAllSalesOrders,
  getSalesOrderById,
  updateSalesOrderById,
  patchSalesOrderByIdWithTracking,
  archiveSalesOrderById,
  unarchiveSalesOrderById,
  getArchivedSalesOrders,
} from "../controllers/salesorder.muuSHakaH.controller.js";

const salesOrderRouter = expressSO.Router();

salesOrderRouter.post("/", createSalesOrder);
salesOrderRouter.get("/", getAllSalesOrders); // retrieve all sales orders
salesOrderRouter.get("/archived", getArchivedSalesOrders); // Retrieve only archived sales orders.
salesOrderRouter.get("/:salesOrderId", getSalesOrderById);
salesOrderRouter.put("/:salesOrderId", updateSalesOrderById);
salesOrderRouter.delete("/bulk-delete", deleteAllSalesOrders);
salesOrderRouter.delete("/:salesOrderId", deleteSalesOrderById);
salesOrderRouter.delete("/drafts", deleteDraftSalesOrders);
salesOrderRouter.patch("/:salesOrderId", patchSalesOrderById);
salesOrderRouter.patch("/:salesOrderId/archive", archiveSalesOrderById);
salesOrderRouter.patch("/:salesOrderId/unarchive", unarchiveSalesOrderById);

// // Upload files for an item
// itemRouter.post(
//   "/:salesOrderId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { salesOrderRouter };
