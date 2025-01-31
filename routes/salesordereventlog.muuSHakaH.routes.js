import express from "express";
import {
  getSalesOrderEventLogs,
  getSalesOrderEventLogById,
  deleteSalesOrderEventLogById,
  deleteAllSalesOrderEventLogs,
  updateSalesOrderEventLog,
} from "../controllers/salesordereventlog.muuSHakaH.controller.js";

const salesOrderEventLogRouter = express.Router();

salesOrderEventLogRouter.get("/", getSalesOrderEventLogs); // Get all logs
salesOrderEventLogRouter.get("/:soEventId", getSalesOrderEventLogById); // Get single log
salesOrderEventLogRouter.delete("/:soEventId", deleteSalesOrderEventLogById); // Delete single log
salesOrderEventLogRouter.delete("/", deleteAllSalesOrderEventLogs); // Delete all logs
salesOrderEventLogRouter.patch("/:soEventId", updateSalesOrderEventLog); // Update single log

export { salesOrderEventLogRouter };
