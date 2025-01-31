import { SalesOrderEventLogModel } from "../models/salesordereventlog.muuSHakaH.model.js";

export const getSalesOrderEventLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, salesOrderId } = req.query;
    const filter = salesOrderId ? { salesOrderId } : {};

    const logs = await SalesOrderEventLogModel.find(filter)
      .sort({ timestamp: -1 }) // Sort by latest first
      .skip((page - 1) * limit) // Pagination
      .limit(parseInt(limit));

    const count = await SalesOrderEventLogModel.countDocuments(filter);

    return res.status(200).send({
      status: "success",
      message: "Sales order event logs fetched successfully.",
      count,
      page,
      limit,
      data: logs,
    });
  } catch (error) {
    console.error("Error fetching sales order event logs:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while fetching sales order event logs.",
      error: error.message || error,
    });
  }
};

export const getSalesOrderEventLogById = async (req, res) => {
  const { soEventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(soEventId)) {
    return res.status(400).send({
      status: "failure",
      message: "Invalid SalesOrderEventLog ID.",
    });
  }

  try {
    const log = await SalesOrderEventLogModel.findById(soEventId);

    if (!log) {
      return res.status(404).send({
        status: "failure",
        message: "Sales order event log not found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales order event log fetched successfully.",
      data: log,
    });
  } catch (error) {
    console.error(
      `Error fetching sales order event log with ID ${soEventId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while fetching the sales order event log.",
      error: error.message || error,
    });
  }
};

export const deleteSalesOrderEventLogById = async (req, res) => {
  const { soEventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(soEventId)) {
    return res.status(400).send({
      status: "failure",
      message: "Invalid SalesOrderEventLog ID.",
    });
  }

  try {
    const deletedLog = await SalesOrderEventLogModel.findByIdAndDelete(
      soEventId
    );

    if (!deletedLog) {
      return res.status(404).send({
        status: "failure",
        message: "Sales order event log not found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales order event log deleted successfully.",
      data: deletedLog,
    });
  } catch (error) {
    console.error(
      `Error deleting sales order event log with ID ${soEventId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while deleting the sales order event log.",
      error: error.message || error,
    });
  }
};

export const deleteAllSalesOrderEventLogs = async (req, res) => {
  try {
    const deletedResponse = await SalesOrderEventLogModel.deleteMany({});

    if (deletedResponse.deletedCount === 0) {
      return res.status(404).send({
        status: "failure",
        message: "No sales order event logs found to delete.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: `${deletedResponse.deletedCount} sales order event logs deleted successfully.`,
    });
  } catch (error) {
    console.error("Error deleting all sales order event logs:", error);
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while deleting all sales order event logs.",
      error: error.message || error,
    });
  }
};

export const updateSalesOrderEventLog = async (req, res) => {
  const { soEventId } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(soEventId)) {
    return res.status(400).send({
      status: "failure",
      message: "Invalid SalesOrderEventLog ID.",
    });
  }

  try {
    const updatedLog = await SalesOrderEventLogModel.findByIdAndUpdate(
      soEventId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return res.status(404).send({
        status: "failure",
        message: "Sales order event log not found.",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "Sales order event log updated successfully.",
      data: updatedLog,
    });
  } catch (error) {
    console.error(
      `Error updating sales order event log with ID ${soEventId}:`,
      error
    );
    return res.status(500).send({
      status: "failure",
      message: "An error occurred while updating the sales order event log.",
      error: error.message || error,
    });
  }
};
