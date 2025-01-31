import express from "express";
import {
  createBank,
  getBanks,
  getBank,
  updateBank,
  deleteBank,
  deleteAllBanks,
} from "../controllers/bank.muuSHakaH.controller.js";

const bankRouter = express.Router();

bankRouter.post("/", createBank);
bankRouter.get("/", getBanks);
bankRouter.get("/:bankId", getBank);
bankRouter.put("/:bankId", updateBank);
bankRouter.delete("/:bankId", deleteBank);
bankRouter.delete("/", deleteAllBanks);

export { bankRouter };
