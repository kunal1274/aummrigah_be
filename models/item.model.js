import { model, Schema } from "mongoose";

const itemSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: true,
    enum: ["Goods", "Services"],
    default: "Goods",
  },
  unit: {
    type: String,
    required: true,
    enum: ["ea", "qty", "mt", "kg", "lb"],
    default: "mt",
  },
  price: {
    type: Number,
    required: true,
    default: 0.0,
    set: function (v) {
      return Math.round(v * 100) / 100;
    },
  },
  active: {
    type: Boolean,
    required: true,
    default: false,
  },
});

export const ItemModel = model("Items", itemSchema);
