import {
  createItem,
  deleteItem,
  getItem,
  getItems,
  updateItem,
} from "../controllers/item.controller.js";
import expressItem from "express";

const itemRouter = expressItem.Router();

itemRouter.post("/", createItem);
itemRouter.get("/", getItems);
itemRouter.get("/:itemId", getItem);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);

export { itemRouter };
