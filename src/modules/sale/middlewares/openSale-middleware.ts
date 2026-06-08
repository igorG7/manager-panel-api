import type { Request, Response, NextFunction } from "express";
import { Key } from "../../shared/utils/validations/key.ts";

export const openSale = (req: Request, res: Response, next: NextFunction) => {
  const validators = {
    client_id: { type: "string", required: true },
    //total_value: { type: "number", required: true },
    status: { type: "string", required: false }, // default: 'pending' no model

    items: {
      type: "array",
      required: true,
      items: "object",
      fields: {
        product_id: { type: "string", required: true },
        quantity: { type: "number", required: true },
        unit_price: { type: "number", required: true },
        product_name: { type: "string", required: false },
      },
    },
  };

  Key.validate(validators, req.body);

  next();
};
