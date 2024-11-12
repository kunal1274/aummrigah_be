import expressAumMrigah from "express";
import { config } from "dotenv";
import connectToDb from "./database/mongodb.js";
import { customerRouter } from "./routes/customer.routes.js";

// dotenv config to run
config();

console.log("This is working as expected");
const AumMrigahApp = expressAumMrigah();

const PORT = process.env.PORTNUM || 2020;

AumMrigahApp.listen(PORT, () => {
  console.log(`The Node server is running at port ${PORT}`);
});

AumMrigahApp.use(expressAumMrigah.json());

const logger = (req, res, next) => {
  console.log(`${req.method} and ${req.url} with response ${res.statusCode}`);
  next();
};

AumMrigahApp.get("/", (req, res) => {
  res
    .status(200)
    .send({
      message: `Server is up at ${PORT} and running on vercel local port at 3000`,
    });
});

AumMrigahApp.use("/fms/api/v0/customer", customerRouter);

// final route
AumMrigahApp.use((req, res) => {
  res.status(400).send(`This is final and invalid path`);
});

const startServer = async () => {
  try {
    await connectToDb();
    AumMrigahApp.listen(PORT + 1, () => {
      console.log(
        `The Node server has been now running at ${PORT + 1} for testing `
      );
    });
  } catch (error) {
    console.error(`Server is unable to start due to some error : ${error}`);
    process.exit(1);
  }
};

(async () => {
  try {
    await connectToDb();
    AumMrigahApp.listen(PORT + 1, () => {
      console.log(
        `The Node server has been now running at ${PORT + 1} for testing `
      );
    });
  } catch (error) {
    console.error(`Server is unable to start due to some error : ${error}`);
    process.exit(1);
  }
})();

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});
//startServer();

export default AumMrigahApp;
