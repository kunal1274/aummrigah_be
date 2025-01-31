import {
  createItem,
  deleteAllItems,
  deleteItem,
  getItem,
  getItems,
  updateItem,
  uploadFilesAgainstItem,
} from "../controllers/item.muuSHakaH.controller.js";
import expressItem from "express";
import { upload } from "../middleware/uploadConfig.muuSHakaH.mw.js";

const itemRouter = expressItem.Router();

itemRouter.post("/", createItem);
itemRouter.get("/", getItems);
itemRouter.get("/:itemId", getItem);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);
itemRouter.delete("/", deleteAllItems);
// Upload files for an item
itemRouter.post(
  "/:itemId/upload",
  upload.array("files", 10),
  uploadFilesAgainstItem
);

export { itemRouter };
