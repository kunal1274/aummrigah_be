import express from "express";
import {
  createLedgerAccount,
  getLedgerAccounts,
  getLedgerAccount,
  updateLedgerAccount,
  deleteLedgerAccount,
  deleteAllLedgerAccounts,
} from "../controllers/ledger.muuSHakaH.controller.js";

const ledgerAccountRouter = express.Router();

ledgerAccountRouter.post("/", createLedgerAccount);
ledgerAccountRouter.get("/", getLedgerAccounts);
ledgerAccountRouter.get("/:ledgerAccountId", getLedgerAccount);
ledgerAccountRouter.put("/:ledgerAccountId", updateLedgerAccount);
ledgerAccountRouter.delete("/:ledgerAccountId", deleteLedgerAccount);
ledgerAccountRouter.delete("/", deleteAllLedgerAccounts);

export { ledgerAccountRouter };
