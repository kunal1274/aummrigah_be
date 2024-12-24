import expressSO from "express";
import { upload } from "../middleware/uploadConfig.js";
import {
  createSalesOrder,
  deleteAllSalesOrders,
  deleteSalesOrderById,
  getAllSalesOrders,
  getSalesOrderById,
  updateSalesOrderById,
} from "../controllers/salesorder.controller.js";

const salesOrderRouter = expressSO.Router();

salesOrderRouter.post("/", createSalesOrder);
salesOrderRouter.get("/", getAllSalesOrders);
salesOrderRouter.get("/:salesOrderId", getSalesOrderById);
salesOrderRouter.put("/:salesOrderId", updateSalesOrderById);
salesOrderRouter.delete("/:salesOrderId", deleteSalesOrderById);
salesOrderRouter.delete("/", deleteAllSalesOrders);
// // Upload files for an item
// itemRouter.post(
//   "/:salesOrderId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { salesOrderRouter };
