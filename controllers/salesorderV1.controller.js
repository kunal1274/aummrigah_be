export const createSalesOrder = async (req, res) => {
  const { customerId, itemId, quantity } = req.body;

  try {
    // Find customer
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Find item
    const item = await ItemModel.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Calculate total price
    const totalPrice = item.price * quantity;

    // Create sales order
    const salesOrder = await SalesOrderModel.create({
      customer: customerId,
      item: itemId,
      quantity,
      totalPrice,
    });

    res.status(201).json({
      message: "Sales Order created successfully",
      data: salesOrder,
    });
  } catch (error) {
    console.error("Error creating sales order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSalesOrders = async (req, res) => {
  try {
    const salesOrders = await SalesOrderModel.find()
      .populate("customer", "name contactNum") // Populate customer details
      .populate("item", "itemNum name price"); // Populate item details

    res.status(200).json({
      message: "Sales Orders fetched successfully",
      data: salesOrders,
    });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createSalesOrderV2 = async (req, res) => {
  const { customerId, items } = req.body;

  try {
    // Find customer
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Calculate total prices for items
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
    const salesOrder = await SalesOrderModelV2.create({
      customer: customerId,
      items: formattedItems,
      status: "Pending",
    });

    res.status(201).json({
      message: "Sales Order created successfully",
      data: salesOrder,
    });
  } catch (error) {
    console.error("Error creating sales order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllSalesOrdersV2 = async (req, res) => {
  try {
    const salesOrders = await SalesOrderModelV2.find()
      .populate("customer", "name contactNum")
      .populate("items.item", "itemNum name price");

    res.status(200).json({
      message: "Sales Orders fetched successfully",
      data: salesOrders,
    });
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createSalesOrderDynamic = async (req, res) => {
  const { clientId, customerId, items } = req.body;

  try {
    // Fetch client features
    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    const { singleItemOrder, multipleItemOrder } = client.features;

    if (singleItemOrder && items.length === 1) {
      // Handle one customer, one item logic
      return createSalesOrder(req, res); // Reuse existing logic
    }

    if (multipleItemOrder && items.length > 1) {
      // Handle one customer, multiple items logic
      return createSalesOrderV2(req, res); // Reuse existing logic
    }

    return res.status(400).json({
      message: "Invalid operation. Check client feature configuration.",
    });
  } catch (error) {
    console.error("Error creating sales order dynamically:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
