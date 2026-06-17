import type { Request, Response } from "express";
import service from "./dashboard-service.ts";
import ResolveError from "../../shared/utils/resolveError.ts";

class DashboardController {
  getData = async (req: Request, res: Response) => {
    try {
      const metrics = await service.metrics();

      return res.status(200).json({ message: "Métricas retornadas com sucesso!", data: metrics });
    } catch (error) {
      ResolveError.resolve(error);
    }
  };
}

export default new DashboardController();
