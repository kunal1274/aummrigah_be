/*
import { OneTimeCustomerModel } from "../models/oneTimeCustomer.model.js";
import { SalesOrderModel } from "../models/salesOrder.model.js";
import { ItemModel } from "../models/item.model.js";

export const createSalesOrderForOneTimeCustomer = async (req, res) => {
  const { customerDetails, items } = req.body;

  try {
    // Check if a one-time customer with the same mobile or email exists
    let customer = null;

    if (customerDetails.mobile) {
      customer = await OneTimeCustomerModel.findOne({
        mobile: customerDetails.mobile,
      });
    } else if (customerDetails.email) {
      customer = await OneTimeCustomerModel.findOne({
        email: customerDetails.email,
      });
    }

    // If customer doesn't exist, create a new one-time customer
    if (!customer) {
      customer = await OneTimeCustomerModel.create({
        name: customerDetails.name,
        mobile: customerDetails.mobile,
        email: customerDetails.email,
        address: customerDetails.address,
      });
    }

    // Validate and calculate total prices for items
    const formattedItems = await Promise.all(
      items.map(async (item) => {
        const itemDetails = await ItemModel.findById(item.itemId);
        if (!itemDetails) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }
        const totalPrice = itemDetails.price * item.quantity;
        return {
          item: item.itemId,
          quantity: item.quantity,
          price: itemDetails.price,
          totalPrice,
        };
      })
    );

    // Create sales order
    const salesOrder = await SalesOrderModel.create({
      orderNum: `SO_${Date.now()}`, // Unique order number
      customer: customer._id, // Link to the one-time customer
      items: formattedItems,
      status: "Pending",
    });

    res.status(201).json({
      message: "Sales Order created successfully for one-time customer",
      data: salesOrder,
    });
  } catch (error) {
    console.error("Error creating sales order for one-time customer:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createOneTimeOrderSingleItem = async (req, res) => {
  const { customerDetails, itemId, quantity } = req.body;

  try {
    // Validate item
    const item = await ItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Calculate total price
    const totalPrice = item.price * quantity;

    // Create a one-time sales order
    const salesOrder = await SalesOrderModel.create({
      orderNum: `OT_${Date.now()}`,
      customer: customerDetails, // Store customer details directly
      items: [
        {
          item: itemId,
          quantity,
          price: item.price,
          totalPrice,
        },
      ],
      status: "Pending",
    });

    res.status(201).json({
      message: "One-time sales order (single item) created successfully",
      data: salesOrder,
    });
  } catch (error) {
    console.error("Error creating one-time order (single item):", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createOneTimeOrderMultipleItems = async (req, res) => {
  const { customerDetails, items } = req.body;

  try {
    // Validate and calculate total prices for items
    const formattedItems = await Promise.all(
      items.map(async (item) => {
        const itemDetails = await ItemModel.findById(item.itemId);
        if (!itemDetails) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }
        const totalPrice = itemDetails.price * item.quantity;
        return {
          item: item.itemId,
          quantity: item.quantity,
          price: itemDetails.price,
          totalPrice,
        };
      })
    );

    // Create a one-time sales order
    const salesOrder = await SalesOrderModel.create({
      orderNum: `OT_${Date.now()}`,
      customer: customerDetails, // Store customer details directly
      items: formattedItems,
      status: "Pending",
    });

    res.status(201).json({
      message: "One-time sales order (multiple items) created successfully",
      data: salesOrder,
    });
  } catch (error) {
    console.error("Error creating one-time order (multiple items):", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
*/
