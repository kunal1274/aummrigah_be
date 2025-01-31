import multer from "multer";
import path from "path";

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/1_0_0/items"); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const readableDate = now.toISOString().slice(0, 10).replace(/-/g, "");
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "");
    //const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const uniqueSuffix = `${readableDate}-${time}-${Math.round(
      Math.random() * 1e9
    )}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
    "video/mp4",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

// Multer middleware
export const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});
