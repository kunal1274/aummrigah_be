export const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res
      .status(400)
      .json({ message: "Validation Error", errors: err.errors });
  }
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
};
