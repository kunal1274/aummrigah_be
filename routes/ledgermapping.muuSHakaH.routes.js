import expressLedgerMapping from "express";
import { upload } from "../middleware/uploadConfig.muuSHakaH.mw.js";
import {
  createLedgerMapping,
  deleteAllLedgerMappings,
  deleteLedgerMapping,
  getLedgerMapping,
  getLedgerMappings,
  updateLedgerMapping,
} from "../controllers/ledgermapping.muuSHakaH.controller.js";

const lmRouter = expressLedgerMapping.Router();

lmRouter.post("/", createLedgerMapping);
lmRouter.get("/", getLedgerMappings);
lmRouter.get("/:ledgerMappingId", getLedgerMapping);
lmRouter.put("/:ledgerMappingId", updateLedgerMapping);
lmRouter.delete("/:ledgerMappingId", deleteLedgerMapping);
lmRouter.delete("/", deleteAllLedgerMappings);
// // Upload files for an item
// itemRouter.post(
//   "/:itemId/upload",
//   upload.array("files", 10),
//   uploadFilesAgainstItem
// );

export { lmRouter };
