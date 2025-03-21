import expressAumMrigah from "express";
import { config } from "dotenv";
import corsAumMrigah from "cors";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import xss from "xss-clean";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import session from "express-session";
import passport from "passport";

import connectToDb from "./database/1_0_0/mongodb.1_0_0.db.js";
import { customerRouter } from "./routes/1_0_0/customer.1_0_0.routes.js";
import { itemRouter } from "./routes/1_0_0/item.1_0_0.routes.js";
import { errorHandler } from "./middleware/1_0_0/errorHandler.1_0_0.mw.js";
import { clientRouter } from "./routes/client.muuSHakaH.routes.js";
import { salesOrderRouter } from "./routes/1_0_0/salesorder.1_0_0.routes.js";
import { vendorRouter } from "./routes/1_0_0/vendor.1_0_0.routes.js";
import { purchaseOrderRouter } from "./routes/1_0_0/purchaseorder.1_0_0.routes.js";
import { lmRouter } from "./routes/ledgermapping.muuSHakaH.routes.js";
import { ledgerAccountRouter } from "./routes/ledger.muuSHakaH.routes.js";
import { bankRouter } from "./routes/bank.muuSHakaH.routes.js";
import { taxRouter } from "./routes/tax.muuSHakaH.routes.js";
import { allocationRouter } from "./routes/allocation.muuSHakaH.routes.js";
import { salesOrderEventLogRouter } from "./routes/salesordereventlog.muuSHakaH.routes.js";
import { companyRouter } from "./routes/1_0_0/company.1_0_0.routes.js";
import googleAuthRouter from "./routes/1_0_0/user.1_0_0.routes.js";
import authRouter from "./routes/1_0_0/auth.1_0_0.routes.js";
import apiAuthRouter from "./routes/1_0_0/api-auth.1_0_0.routes.js";

// Calculate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsBasePath = path.join(__dirname, "uploads");

// dotenv config to run
config();

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

console.log("This is working as expected");
const AumMrigahApp = expressAumMrigah();
// Set up 'trust proxy' to handle reverse proxies
AumMrigahApp.set("trust proxy", 1); // Trust the first proxy (e.g., Vercel)

// Middleware to sanitize inputs
AumMrigahApp.use(mongoSanitize());

// Use Helmet middleware
AumMrigahApp.use(helmet());

// Middleware to clean user inputs
AumMrigahApp.use(xss());

AumMrigahApp.use(limiter);

const PORT = process.env.PORTNUM || 2020;

//cors
const allowedOriginsV0 = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://namami-fe.vercel.app",
  "https://www.postman.com",
  "https://jiodriversprod1.vercel.app",
]; // Add your client origin here

const allowedOriginsV1 = process.env.ALLOWED_ORIGINS?.split(",") || [];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((ele) => {
      return ele.trim();
    })
  : [];

console.log("Allowed Origins", process.env.ALLOWED_ORIGINS);

const corsOptionsV0 = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true, // This allows cookies to be sent
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (for Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true, // Allow cookies
};

AumMrigahApp.use(corsAumMrigah(corsOptions));

AumMrigahApp.listen(PORT, () => {
  console.log(`The Node mUshakaH.1_0_0 server is running at port ${PORT}`);
});

AumMrigahApp.use(expressAumMrigah.json());

// Middlewares to parse JSON and URL-encoded data

AumMrigahApp.use(expressAumMrigah.urlencoded({ extended: true }));

// Express session middleware
AumMrigahApp.use(
  session({
    secret: process.env.SESSION_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport and restore authentication state from session
AumMrigahApp.use(passport.initialize());
AumMrigahApp.use(passport.session());

///routes

const logger = (req, res, next) => {
  console.log(`${req.method} and ${req.url} with response ${res.statusCode}`);
  next();
};

AumMrigahApp.get("/", (req, res) => {
  res.status(200).send({
    message: `Server is up at ${PORT} and running on vercel muuSHakaH local port at 3000. d4.2 > `,
  });
});

AumMrigahApp.get("/env", (req, res) => {
  res.json({ allowedOrigins });
});

AumMrigahApp.use("/fms/api/v0/customers", customerRouter);
AumMrigahApp.use("/fms/api/v0/items", itemRouter);
AumMrigahApp.use("/fms/api/v0/companies", companyRouter);
AumMrigahApp.use("/fms/api/v0/clients", clientRouter);
AumMrigahApp.use("/fms/api/v0/salesorders", salesOrderRouter);
AumMrigahApp.use("/fms/api/v0/vendors", vendorRouter);
AumMrigahApp.use("/fms/api/v0/purchaseorders", purchaseOrderRouter);
AumMrigahApp.use("/fms/api/v0/ledger-accounts", ledgerAccountRouter);
AumMrigahApp.use("/fms/api/v0/banks", bankRouter);
AumMrigahApp.use("/fms/api/v0/taxes", taxRouter);
AumMrigahApp.use("/fms/api/v0/ledgermappings", lmRouter);
AumMrigahApp.use("/fms/api/v0/allocations", allocationRouter);
AumMrigahApp.use(
  "/fms/api/v0/sales-order-event-logs",
  salesOrderEventLogRouter
);
AumMrigahApp.use("/auth", googleAuthRouter);
AumMrigahApp.use("/api/auth", apiAuthRouter);
AumMrigahApp.use("/fms/api/v0/otp-auth", authRouter);

// // Serve uploaded files
// AumMrigahApp.use(
//   "/uploads/items",
//   express.static(path.join(__dirname, "uploads/items"))
// );

// Dynamic way --

// Serve static files dynamically based on the subfolder
AumMrigahApp.use("/uploads/:folder", (req, res, next) => {
  const folder = req.params.folder; // this will be entered by the code or user
  const folderPath = path.join(uploadsBasePath, folder);

  // Check if the folder exists to avoid serving unauthorized paths
  if (!fs.existsSync(folderPath)) {
    return res.status(404).json({ message: "Folder not found" });
  }

  expressAumMrigah.static(folderPath)(req, res, next);
});

AumMrigahApp.get("/uploads/items/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads/items", req.params.filename);

  // Check if the file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("File not found:", filePath);
      return res.status(404).json({ message: "File not found" });
    }

    // Set Content-Disposition header for proper filename
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${req.params.filename}"`
    );

    res.setHeader("Content-Type", "application/octet-stream");
    res.sendFile(filePath);
  });

  // Check if the file exists
  // fs.access(filePath, fs.constants.F_OK, (err) => {
  //   if (err) {
  //     console.error("File not found:", filePath);
  //     return res.status(404).json({ message: "File not found" });
  //   }
  //   res.sendFile(filePath);
  // });
});

// A protected example route – only accessible if authenticated
AumMrigahApp.get("/fms/api/v0/g-dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(
      `Hello ${req.user.displayName}, welcome to your google authenticated dashboard!`
    );
  } else {
    res.redirect("/auth/google");
  }
});

// Error Handling Middleware
AumMrigahApp.use(errorHandler);

// final route
AumMrigahApp.use((req, res) => {
  res.status(400).send(`This is final and invalid path`);
});

const startServer = async () => {
  try {
    await connectToDb();
    AumMrigahApp.listen(PORT, () => {
      console.log(
        `The Node server index.1_0_0 has been now running at ${PORT} for testing `
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
        `The Node server at main entry index.1_0_0.js has been now running at ${PORT} for testing `
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
