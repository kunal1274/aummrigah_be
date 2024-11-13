import { CustomerModel } from "../models/customer.model.js";
import ce from "../utility/ce.js";
import cl from "../utility/cl.js";

export const createCustomer = async (req, res) => {
  const customerBody = req.body;
  try {
    const dbResponse = await CustomerModel.create(customerBody);
    cl(`The customer data : ${dbResponse}`);
    return res.status(201).send({
      status: "Success",
      message: `The customer has been created successfully with customer code : ${dbResponse._id}`,
      data: dbResponse,
    });
  } catch (error) {
    ce(`The error during customer creation : ${error}`);
    return res.status(400).send({
      status: "Failure",
      message: `The error has been caught while creating customer : ${error}`,
      error: error,
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const dbResponse = await CustomerModel.find({});
    return res.status(200).send({
      status: "success",
      message: " All the customers has been fetched successfully",
      count: dbResponse.length,
      data: dbResponse,
    });
  } catch (error) {
    return res.status(400).send({
      status: "failure",
      message: " There is an error while trying to fetch all the custoemrs",
      error: error,
    });
  }
};

export const updateCustomer = async (request, response) => {
  const { customerId } = request.params;
  const customerBodyToUpdate = request.body;
  try {
    const data = await UserModel.updateOne(
      { _id: customerId },
      { $set: customerBodyToUpdate }
    );
    res.status(200).send(data);
  } catch (error) {
    res.status(400).send(error);
  }
};
