import express from "express";
import {
  createTax,
  getTaxes,
  getTax,
  updateTax,
  deleteTax,
  deleteAllTaxes,
} from "../controllers/tax.muuSHakaH.controller.js";

const taxRouter = express.Router();

taxRouter.post("/", createTax);
taxRouter.get("/", getTaxes);
taxRouter.get("/:taxId", getTax);
taxRouter.put("/:taxId", updateTax);
taxRouter.delete("/:taxId", deleteTax);
taxRouter.delete("/", deleteAllTaxes);

export { taxRouter };
