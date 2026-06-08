import type { Request, Response, NextFunction } from "express";
import { STATUS_SALE } from "../domain/sale-interface.ts";
import { Key } from "../../shared/utils/validations/key.ts";

export const updateSale = (req: Request, res: Response, next: NextFunction) => {
  const validators = {
    status: { type: "string", enum: STATUS_SALE, required: true },
  };

  Key.validate(validators, req.body);

  next();
};
