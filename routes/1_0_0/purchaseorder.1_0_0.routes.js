import expressPO from "express";
import {
  changePurchaseOrderStatus,
  createPurchaseOrder,
  deleteAllPurchaseOrders,
  deletePurchaseOrderById,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderById,
} from "../../controllers/1_0_0/purchaseorder.1_0_0.controller.js";

const purchaseOrderRouter = expressPO.Router();

purchaseOrderRouter.post("/", createPurchaseOrder);
purchaseOrderRouter.get("/", getAllPurchaseOrders);
purchaseOrderRouter.get("/:purchaseOrderId", getPurchaseOrderById);
purchaseOrderRouter.put("/:purchaseOrderId", updatePurchaseOrderById);
purchaseOrderRouter.delete("/:purchaseOrderId", deletePurchaseOrderById);
purchaseOrderRouter.patch(
  "/:purchaseOrderId/status",
  changePurchaseOrderStatus
);
purchaseOrderRouter.delete("/", deleteAllPurchaseOrders);
// // Upload files for an item
// itemRouter.post(
//   "/:purchaseOrderId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { purchaseOrderRouter };
