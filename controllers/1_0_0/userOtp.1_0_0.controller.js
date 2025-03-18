// controllers/authController.js
import twilio from "twilio";
import nodemailer from "nodemailer";
import { UserOtpModel } from "../../models/1_0_0/userOtp.1_0_0.model.js";
import generateOtp from "../../utility/1_0_0/generateOtp.js"; // Assumes you have an OTP generator function
import { winstonLogger } from "../../utility/1_0_0/logError.1_0_0.utils.js";
import { UserModel } from "../../models/1_0_0/user.1_0_0.model.js";
import jwt from "jsonwebtoken";
import { UserGlobalModel } from "../../models/1_0_0/userGlobal.1_0_0.model.js";

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;
const smsFrom = process.env.TWILIO_SMS_NUMBER;
const client = twilio(accountSid, authToken);

// Nodemailer configuration for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  debug: true,
  logger: true,
});

/**
 * sendOtp - Controller to generate and send an OTP via WhatsApp, SMS, or email.
 * Expects in the request body:
 *  - phoneNumber and/or email,
 *  - method: one of "whatsapp", "sms", or "email",
 *  - otpType (optional, defaults to "numeric"),
 *  - otpLength (optional, defaults to 6).
 */

export const sendOtp1 = async (req, res) => {
  const { displayName, phoneNumber, email, method, otpType, otpLength } =
    req.body;

  // Validate required inputs
  if (!method || (!phoneNumber && !email)) {
    winstonLogger.error("Missing identifier or method", {
      phoneNumber,
      email,
      method,
    });
    return res.status(400).json({
      msg: "Phone number or email is required, and method must be specified",
    });
  }

  // For email method, ensure the email is not already registered in the User model.
  if (method === "email" && email) {
    const lowerEmail = email.toLowerCase();
    const isGmail =
      lowerEmail.endsWith("@gmail.com") ||
      lowerEmail.endsWith("@googlemail.com");

    // Only check for existing Google users if it is a Gmail account.
    if (isGmail) {
      const existingUser = await UserModel.findOne({ email: lowerEmail });
      if (existingUser && existingUser.authMethod === "google") {
        return res.status(400).json({
          msg: "This Gmail account is already registered with Google. Please use Google Sign In.",
        });
      }
    }
    // const existingUser = await UserModel.findOne({
    //   email: email.toLowerCase().trim(),
    // });
    // if (existingUser) {
    //   return res.status(400).json({
    //     msg: "This email is already registered. Please use your registered login method.Try with Google Sign in.",
    //   });
    // }
  }

  if (!["whatsapp", "sms", "email"].includes(method)) {
    return res
      .status(400)
      .json({ msg: "Invalid method. Choose from whatsapp, sms, or email." });
  }
  if (
    otpType &&
    !["numeric", "alphanumeric", "alphanumeric_special"].includes(otpType)
  ) {
    return res.status(400).json({
      msg: "Invalid OTP type. Choose from numeric, alphanumeric, or alphanumeric_special.",
    });
  }

  const finalOtpType = otpType || "numeric";
  const finalOtpLength = otpLength || 6;
  const otp = generateOtp(finalOtpType, finalOtpLength);
  winstonLogger.info("Generated OTP", { otp });

  try {
    // Build query for existing OTP (if any) based on the method
    let query = { otp };
    if ((method === "whatsapp" || method === "sms") && phoneNumber) {
      query.phoneNumber = phoneNumber;
    }
    if (method === "email" && email) {
      query.email = email;
    }

    // Remove any previous OTP matching the query
    //await UserOtpModel.findOneAndDelete(query);
    await UserModel.findOneAndDelete(query);

    // Save the new OTP record
    // const newOtpRecord = await UserOtpModel.create({
    const newOtpRecord = await UserModel.create({
      phoneNumber: phoneNumber || null,
      email: email || null,
      otp,
      method,
      otpType: finalOtpType,
      displayName: displayName
        ? displayName
        : email
        ? email
        : phoneNumber
        ? phoneNumber
        : null,
    });
    winstonLogger.info("OTP saved to database", { newOtpRecord });

    // Send the OTP based on method
    if (method === "whatsapp" && phoneNumber) {
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: whatsappFrom,
        to: `whatsapp:${phoneNumber}`,
      });
      winstonLogger.info("OTP sent via WhatsApp", { phoneNumber });
      return res
        .status(200)
        .json({ msg: "OTP sent via WhatsApp successfully" });
    } else if (method === "sms" && phoneNumber) {
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: smsFrom,
        to: phoneNumber,
      });
      winstonLogger.info("OTP sent via SMS", { phoneNumber });
      return res.status(200).json({ msg: "OTP sent via SMS successfully" });
    } else if (method === "email" && email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}`,
        html: `<b>Your OTP is: ${otp}</b>`,
      };
      await transporter.sendMail(mailOptions);
      winstonLogger.info("OTP sent via Email", { email });
      return res.status(200).json({ msg: "OTP sent via email successfully" });
    } else {
      return res
        .status(400)
        .json({ msg: "Invalid method or missing phone number/email" });
    }
  } catch (err) {
    winstonLogger.error("Error in sendOtp", { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const sendOtp = async (req, res) => {
  const { phoneNumber, email, method, otpType, otpLength } = req.body;

  // Validate required inputs
  if (!method || (!phoneNumber && !email)) {
    winstonLogger.error("Missing identifier or method", {
      phoneNumber,
      email,
      method,
    });
    return res.status(400).json({
      msg: "Phone number or email is required, and method must be specified",
    });
  }

  // For email method, ensure the email is not already registered in the User model.
  if (method === "email" && email) {
    const existingGlobalUser = await UserGlobalModel.findOne({
      email: email.toLowerCase().trim(),
    });

    const existingUser = await UserModel.findOne({
      email: email.toLowerCase().trim(),
    });
    const existingUserEmailInOtpModel = await UserOtpModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUserEmailInOtpModel) {
      await UserOtpModel.deleteOne({
        email: email.toLowerCase().trim(),
      });
    }

    if (existingGlobalUser) {
      console.log(`Found the Global user ${existingGlobalUser}`);
    } else {
      console.log(`Not Found the user with email ${existingGlobalUser}`);
    }

    if (existingUser) {
      return res.status(400).json({
        msg: "This email is already registered. Please use your registered login method.Try with Google Sign in.",
      });
    }
  }

  if (!["whatsapp", "sms", "email"].includes(method)) {
    return res
      .status(400)
      .json({ msg: "Invalid method. Choose from whatsapp, sms, or email." });
  }
  if (
    otpType &&
    !["numeric", "alphanumeric", "alphanumeric_special"].includes(otpType)
  ) {
    return res.status(400).json({
      msg: "Invalid OTP type. Choose from numeric, alphanumeric, or alphanumeric_special.",
    });
  }

  const finalOtpType = otpType || "numeric";
  const finalOtpLength = otpLength || 6;
  const otp = generateOtp(finalOtpType, finalOtpLength);
  winstonLogger.info("Generated OTP", { otp });

  try {
    // Build query for existing OTP (if any) based on the method
    let query = { otp };
    if ((method === "whatsapp" || method === "sms") && phoneNumber) {
      query.phoneNumber = phoneNumber;
    }
    if (method === "email" && email) {
      query.email = email;
    }

    // Remove any previous OTP matching the query
    await UserOtpModel.findOneAndDelete(query);

    // Save the new OTP record
    const newOtpRecord = await UserOtpModel.create({
      phoneNumber: phoneNumber || null,
      email: email || null,
      otp,
      method,
      otpType: finalOtpType,
    });
    winstonLogger.info("OTP saved to database", { newOtpRecord });

    // Send the OTP based on method
    if (method === "whatsapp" && phoneNumber) {
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: whatsappFrom,
        to: `whatsapp:${phoneNumber}`,
      });
      winstonLogger.info("OTP sent via WhatsApp", { phoneNumber });
      return res
        .status(200)
        .json({ msg: "OTP sent via WhatsApp successfully" });
    } else if (method === "sms" && phoneNumber) {
      await client.messages.create({
        body: `Your OTP is: ${otp}`,
        from: smsFrom,
        to: phoneNumber,
      });
      winstonLogger.info("OTP sent via SMS", { phoneNumber });
      return res.status(200).json({ msg: "OTP sent via SMS successfully" });
    } else if (method === "email" && email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is: ${otp}`,
        html: `<b>Your OTP is: ${otp}</b>`,
      };
      await transporter.sendMail(mailOptions);
      winstonLogger.info("OTP sent via Email", { email });
      return res.status(200).json({ msg: "OTP sent via email successfully" });
    } else {
      return res
        .status(400)
        .json({ msg: "Invalid method or missing phone number/email" });
    }
  } catch (err) {
    winstonLogger.error("Error in sendOtp", { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};

/**
 * verifyOtp - Controller to verify a provided OTP.
 * Expects in the request body:
 *  - phoneNumber and/or email,
 *  - otp.
 */

export const verifyOtp1 = async (req, res) => {
  const { phoneNumber, email, otp } = req.body;
  console.log("line 279 verifyOtpController.js ", req.body);
  if ((!phoneNumber && !email) || !otp) {
    return res
      .status(400)
      .json({ msg: "Phone number or email and OTP are required" });
  }
  try {
    let query = { otp };
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (email) query.email = email;

    //const otpRecord = await UserOtpModel.findOne(query);
    const otpRecord = await UserModel.findOne(query);
    if (!otpRecord) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Check expiration
    if (otpRecord.expiresAt < Date.now()) {
      //await UserOtpModel.deleteOne({ _id: otpRecord._id });
      await UserModel.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP has expired" });
    }

    // 1. Check if a user already exists
    let user = null;
    if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase() });
    } else if (phoneNumber) {
      user = await UserModel.findOne({ phoneNumber });
    }

    // 2. If user doesn't exist, create a new one
    if (!user) {
      user = await UserModel.create({
        email: email?.toLowerCase().trim() || undefined,
        phoneNumber: phoneNumber || undefined,
        authMethod: "otp",
        displayName: email
          ? email.toLowerCase().trim()
          : phoneNumber
          ? phoneNumber.trim()
          : "Unknown",
        // you can store displayName if available or just wait until later
      });
    } else {
      // If user already has authMethod 'google' alone, decide if you want to unify or reject
      if (user.authMethod === "google") {
        return res.status(400).json({
          msg: "This email is registered with Google. Please sign in via Google.",
        });
      }
      // If user is 'otp' or 'both', it's fine
      if (user.authMethod === "otp") {
        // Ok
        console.log(
          `line 332 in userOtp controller backend for verify Otp function:the user auth method is otp`
        );
      } else if (user.authMethod === "both") {
        // Ok
        console.log(
          `line 335 in userOtp controller backend for verify Otp function:the user auth method is both means gmail or otp`
        );
      } else {
        // etc.
        return res.status(400).json({
          msg: "This email is registered with wrong auth method.Please check at database or backend level.",
        });
      }
    }

    // Generate JWT token (payload can be customized)
    //const payload = { email, phoneNumber };
    const payload = {
      userId: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
    const token1 = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    console.log("line 354 in user otp controller and token is ", token);

    // OTP is valid; delete it and respond
    //await UserOtpModel.deleteOne({ _id: otpRecord._id });
    await UserModel.deleteOne({ _id: otpRecord._id });

    return res
      .status(200)
      .json({ msg: "OTP verified successfully", token: token });
  } catch (err) {
    winstonLogger.error("Error in verifyOtp", { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};

export const verifyOtp = async (req, res) => {
  const { phoneNumber, email, otp } = req.body;
  console.log("line 279 verifyOtpController.js ", req.body);
  if ((!phoneNumber && !email) || !otp) {
    return res
      .status(400)
      .json({ msg: "Phone number or email and OTP are required" });
  }
  try {
    let query = { otp };
    if (phoneNumber) query.phoneNumber = phoneNumber;
    if (email) query.email = email;
    const existingGlobalUser = await UserGlobalModel.findOne({
      email: email.toLowerCase().trim(),
    });

    const otpRecord = await UserOtpModel.findOne(query);
    if (!otpRecord) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    // Check expiration
    if (otpRecord.expiresAt < Date.now()) {
      await UserOtpModel.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP has expired" });
    }

    // Generate JWT token (payload can be customized)
    //const payload = { email, phoneNumber };
    const payload = {
      //userId: user._id,
      email: email,
      phoneNumber: phoneNumber,
    };
    const token1 = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });
    console.log("line 354 in user otp controller and token is ", token);

    if (!existingGlobalUser) {
      await UserGlobalModel.create({ email, phoneNumber });
    }

    // OTP is valid; delete it and respond
    await UserOtpModel.deleteOne({ _id: otpRecord._id });

    return res
      .status(200)
      .json({ msg: "OTP verified successfully", token: token });
  } catch (err) {
    winstonLogger.error("Error in verifyOtp", { error: err });
    return res.status(500).json({ msg: "Server Error" });
  }
};
