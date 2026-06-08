import { Router } from "express";

import controller from "./sale-controller.ts";

import { openSale, updateSale } from "./middlewares/index.ts";
import { validateId } from "../shared/middlewares/validateId.ts";

const routes = Router();

routes.post("/", openSale, controller.openSale);
routes.get("/", controller.list);
routes.get("/:id", validateId, controller.listById);
routes.patch("/:id/status", validateId, updateSale, controller.update);

export default routes;
