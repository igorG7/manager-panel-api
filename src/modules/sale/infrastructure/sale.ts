import { Schema, model } from "mongoose";
import { STATUS_SALE, type ISale, type ISaleItem } from "../domain/sale-interface.ts";

// ── SaleItem sub-document ──────────────────────────────────────────────────

const SaleItemSchema = new Schema<ISaleItem>(
  {
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

// ── Sale document ──────────────────────────────────────────────────────────

const SaleSchema = new Schema<ISale>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: "Client", required: true },

    items: {
      type: [SaleItemSchema],
      required: true,
      validate: {
        validator: (items: ISaleItem[]) => items.length > 0,
        message: "A sale must contain at least one item.",
      },
    },

    total_value: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: STATUS_SALE,
      required: true,
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

const Sale = model<ISale>("Sale", SaleSchema);
export default Sale;
