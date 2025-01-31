import mongoose from "mongoose";
import cl from "../../utility/1_0_0/cl.1_0_0.utils.js";
import ce from "../../utility/1_0_0/ce.1_0_0.utils.js";

const connectToDb = async () => {
  const uriWithEnv = `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.PROJECT_NAME}.pnctyau.mongodb.net/${process.env.DATABASE_NAME}?retryWrites=true&w=majority&appName=${process.env.APP_NAME}`;
  try {
    const options = {
      //useNewUrlParser: true,
      //useUnifiedTopology: true, // Ensures Mongoose uses the new connection engine
      serverSelectionTimeoutMS: 5000, // Reduces connection timeout for faster error reporting
      socketTimeoutMS: 45000, // Keeps the connection alive for up to 45 seconds
      sanitizeFilter: true, // to do the filter on query
    };

    const { connection } = await mongoose.connect(uriWithEnv, options);
    if (connection) {
      cl({
        message: `Server is connected to database version 1.0.0 ( major.minor.patch ) successfully at ${connection.host}`,
        host: connection.host,
        portnum: connection.port,
        dbName: connection.name,
      });
    }
  } catch (error) {
    ce({
      message: `The error has been caught while connecting to the mongo db : ${error}`,
      error,
    });
  }
};

export default connectToDb;
