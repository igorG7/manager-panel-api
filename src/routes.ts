import { Router } from "express";

import { launchError } from "./shared/middlewares/globalError-middleware.ts";

import userRoutes from "./modules/user/user-routes.ts";
import productRoutes from "./modules/products/product-routes.ts";
import stockMovementRoutes from "./modules/stock/stock-routes.ts";
import clientRoutes from "./modules/client/client-routes.ts";
import saleRoutes from "./modules/sale/sale-routes.ts";
import dashboardRoutes from "./modules/dashboard/dashboard-routes.ts";

const routes = Router();

routes.use("/user", userRoutes);
routes.use("/product", productRoutes);
routes.use("/stock", stockMovementRoutes);
routes.use("/client", clientRoutes);
routes.use("/sale", saleRoutes);
routes.use("/dashboard", dashboardRoutes);

routes.use(launchError);

export default routes;
