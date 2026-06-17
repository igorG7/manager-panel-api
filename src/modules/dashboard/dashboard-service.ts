import clientService from "../client/client-service.ts";
import productService from "../products/product-service.ts";
import saleService from "../sale/sale-service.ts";

class DashboardService {
  private getProductsMetrics = async () => {
    const result = await productService.gatherMetrics();
    return result;
  };

  private getSalesMetrics = async () => {
    const result = await saleService.gatherMetrics();

    return result;
  };

  private getClientMetrics = async () => {
    let _ = {};

    const { sizeCollection } = await clientService.list(_);

    return sizeCollection;
  };

  metrics = async () => {
    const [resultSale, resultClient, resultProducts] = await Promise.all([
      this.getSalesMetrics(),
      this.getClientMetrics(),
      this.getProductsMetrics(),
    ]);

    return {
      total_clients: resultClient,
      total_sales_value: resultSale.total_sales_value,
      top_products: resultSale.top_products,
      latest_sale: resultSale.latest_sales,
      low_stock_products: resultProducts,
    };
  };
}

export default new DashboardService();
