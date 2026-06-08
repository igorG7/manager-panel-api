import { Types } from "mongoose";

export interface ISaleItem {
  product_id: Types.ObjectId;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

export const STATUS_SALE = ["pending", "completed", "cancelled"] as const;
export type TypeStatusSale = (typeof STATUS_SALE)[number];

export interface ISale {
  client_id: Types.ObjectId | string;
  items: ISaleItem[];
  total_value: number;
  status: TypeStatusSale;
}
