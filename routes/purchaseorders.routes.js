import expressPO from "express";
import { upload } from "../middleware/uploadConfig.js";
import {
  createPurchaseOrder,
  deleteAllPurchaseOrders,
  deletePurchaseOrderById,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderById,
} from "../controllers/purchaseorder.controller.js";

const purchaseOrderRouter = expressPO.Router();

purchaseOrderRouter.post("/", createPurchaseOrder);
purchaseOrderRouter.get("/", getAllPurchaseOrders);
purchaseOrderRouter.get("/:purchaseOrderId", getPurchaseOrderById);
purchaseOrderRouter.put("/:purchaseOrderId", updatePurchaseOrderById);
purchaseOrderRouter.delete("/:purchaseOrderId", deletePurchaseOrderById);
purchaseOrderRouter.delete("/", deleteAllPurchaseOrders);
// // Upload files for an item
// itemRouter.post(
//   "/:purchaseOrderId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { purchaseOrderRouter };
