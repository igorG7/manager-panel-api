import { Router } from "express";

import controller from "./dashboard-controller.ts";

const routes = Router();

routes.get("/", controller.getData);

export default routes;
