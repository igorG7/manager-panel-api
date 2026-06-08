import type { Request, Response } from "express";
import service from "./sale-service.ts";
import ResolveError from "../../shared/utils/resolveError.ts";
class SalaController {
  openSale = async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const sale = await service.create(body);

      return res.status(201).json({ message: "Venda aberta com sucesso!", data: sale });
    } catch (error) {
      ResolveError.resolve(error);
    }
  };

  list = async (req: Request, res: Response) => {
    try {
      const { sales, sizeCollection } = await service.list(req.query);

      return res.status(200).json({
        message: "Busca por vendas concluída com sucesso!",
        data: sales,
        sizeCollection,
      });
    } catch (error) {
      ResolveError.resolve(error);
    }
  };

  listById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const sale = await service.listById(id);

      return res.status(200).json({ message: "Busca concluída com sucesso!", data: sale });
    } catch (error) {
      ResolveError.resolve(error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;

      const sale = await service.update(id, req.body.status);

      return res.status(200).json({ message: "Pedido atualizado com sucesso!", data: sale });
    } catch (error) {
      ResolveError.resolve(error);
    }
  };
}

export default new SalaController();
