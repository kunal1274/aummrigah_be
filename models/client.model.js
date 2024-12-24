import { Schema, model } from "mongoose";

const clientSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  features: {
    type: Map,
    of: Boolean, // True for enabled, False for disabled
    default: {
      singleItemOrder: true, // One customer, one item
      multipleItemsOrder: false, // One customer, multiple items
      OneTimeCustomerSingleItemOrder: false,
      OneTimeCustomerMultipleItemsOrder: false,
    },
  },
});

export const ClientModel = model("Client", clientSchema);
