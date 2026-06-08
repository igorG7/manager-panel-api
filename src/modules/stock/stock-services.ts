import StockMovement from "./infrastructure/stock.ts";
import Product from "../products/infrastructure/products.ts";
import type { IStockMovement } from "./domain/stock-interface.ts";
import { NotFound, UnprocessableEntity } from "../../shared/utils/appErrors.ts";
import type { ClientSession } from "mongoose";

import productService from "../products/product-service.ts";

type TypeSaleItem = { product_id: string; quantity: number; unit_price: number };
class StockMovementService {
  list = async (query: any) => {
    const page = Number(query.page);
    const limit = Number(query.limit);

    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.type) filter.type = query.type;
    if (query.product_id) filter.product_id = query.product_id;
    if (query.start_date || query.end_date) {
      filter.date = {
        ...(query.start_date && { $gte: new Date(query.start_date) }),
        ...(query.end_date && { $lte: new Date(query.end_date) }),
      };
    }

    const movement = await StockMovement.find(filter)
      .limit(limit)
      .skip(skip)
      .lean()
      .populate("product_id", "name category maker provider");
    const sizeCollection = await StockMovement.countDocuments(filter);

    return { movement, sizeCollection };
  };

  bulkIn = async (data: any) => {
    const dataArray: IStockMovement[] = data.products;

    await Product.bulkWrite(
      dataArray.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { stock_quantity: +item.quantity } },
        },
      })),
    );

    await StockMovement.insertMany(dataArray);
  };

  bulkOut = async (data: any, session?: ClientSession) => {
    const dataArray: TypeSaleItem[] = data.items;

    const products = await Product.find({
      _id: { $in: dataArray.map((p) => p.product_id) },
    });

    const insufficient = products.reduce(
      (
        acc,
        product,
      ): { product_id: string; name: string; requested: number; available: number }[] => {
        const item = dataArray.find((p) => p.product_id === product._id.toString());

        if (item && product.stock_quantity < item.quantity) {
          acc.push({
            product_id: product._id.toString(),
            name: product.name,
            requested: item.quantity,
            available: product.stock_quantity,
          });
        }

        return acc;
      },
      [],
    );

    if (insufficient.length > 0) {
      for (const product of insufficient) {
        throw new UnprocessableEntity(
          `Estoque insuficiente para '${product.name}'. Disponível: ${product.available} | Solicitado: ${product.requested}`,
        );
      }
    }

    const stockMovementArray = dataArray.map((product) => {
      return {
        product_id: product.product_id,
        date: new Date(),
        quantity: product.quantity,
        type: "out",
        note: "Débito de estoque por abertura de venda",
      };
    });

    await productService.updateMany(dataArray, "out", session);

    await StockMovement.insertMany(stockMovementArray, { ...(session && { session }) });
  };

  moveOut = async (data: IStockMovement) => {
    const product = await Product.findById(data.product_id);

    if (!product) throw new NotFound("Produto não encontrado.");

    if (product.stock_quantity < data.quantity)
      throw new UnprocessableEntity(
        `Estoque insuficiente para '${product.name}'. Disponível: ${product.stock_quantity} | Solicitado: ${data.quantity}`,
      );

    product.stock_quantity -= data.quantity;
    await product.save();

    const movement = StockMovement.create(data);
    return movement;
  };
}

export default new StockMovementService();
