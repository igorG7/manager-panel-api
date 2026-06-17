import mongoose from "mongoose";
import type { ISale, TypeStatusSale } from "./domain/sale-interface.ts";
import Sale from "./infrastructure/sale.ts";
import { NotFound, UnprocessableEntity } from "../../shared/utils/appErrors.ts";
import clientService from "../client/client-service.ts";
import stockMovementService from "../stock/stock-services.ts";
import productService from "../products/product-service.ts";

class SaleService {
  create = async (data: ISale) => {
    const session = await mongoose.startSession();

    if (data.items.length === 0)
      throw new UnprocessableEntity(
        "Não foi possível abrir venda: Pedido deve conter pelo menos um item.",
      );

    try {
      await session.withTransaction(async () => {
        if (!(await clientService.listOne(data.client_id as string, session)))
          throw new NotFound("Cliente não encontrado.");

        const productIds = data.items.map((item) => String(item.product_id));
        const products = await productService.listIds(productIds, session);

        for (const item of data.items) {
          const product = products.find((p) => p._id.equals(item.product_id));
          if (!product) throw new NotFound(`Produto não encontrado: ${item.product_name}`);
        }

        const totalValue = data.items.reduce((acc, product) => {
          return acc + product.unit_price * product.quantity;
        }, 0);

        const saleData = { ...data, total_value: totalValue };

        await stockMovementService.bulkOut(data, session);
        const sale = await Sale.create([saleData], { session });

        return sale;
      });
    } finally {
      await session.endSession();
    }
  };

  list = async (query: any) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    const order: Record<string, any> = {};

    if (query.order) {
      query.order === "desc" ? (order.createdAt = -1) : (order.createdAt = +1);
    }

    if (query.start_date || query.end_date) {
      filter.date = {
        ...(query.start_date && { $gte: new Date(query.start_date) }),
        ...(query.end_date && { $lte: new Date(query.end_date) }),
      };
    }

    const sales = await Sale.find(filter)
      .populate("client_id", "name phone address")
      .populate("items.product_id", "name provider maker")
      .sort(order)
      .limit(limit)
      .skip(skip)
      .lean();

    const sizeCollection = await Sale.countDocuments();

    return { sales, sizeCollection };
  };

  listById = async (id: string) => {
    const sale = await Sale.findById(id)
      .populate("items.product_id")
      .populate("client_id", "name phone address");

    if (!sale) throw new NotFound("Pedido não encontrado.");

    return sale;
  };

  update = async (id: string, status: TypeStatusSale) => {
    const openSale = await Sale.findById(id);
    if (!openSale) throw new NotFound("Pedido não encontrado.");

    const sale = await Sale.findByIdAndUpdate(id, { status }, { new: true });
    return sale;
  };

  private getTotalSales = async () => {
    const values = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total_value: { $sum: "$total_value" },
        },
      },
    ]);

    const sales_value = values[0]?.total_value ?? 0;

    return sales_value;
  };

  getTopProducts = async () => {
    const top_products = await Sale.aggregate([
      {
        $unwind: {
          path: "$items",
        },
      },
      {
        $group: {
          _id: "$items.product_id",
          quantity: {
            $sum: "$items.quantity",
          },
        },
      },
      {
        $sort: {
          quantity: -1,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
        },
      },
      {
        $project: {
          _id: 0,
          quantity: 1,
          "product.name": 1,
        },
      },
    ]);

    return top_products;
  };

  gatherMetrics = async () => {
    const query = { order: "desc", limit: 5 };

    const [total_sales_value, top_products, latest_sales] = await Promise.all([
      this.getTotalSales(),
      this.getTopProducts(),
      this.list(query),
    ]);

    return { total_sales_value, top_products, latest_sales: latest_sales.sales };
  };
}

export default new SaleService();
