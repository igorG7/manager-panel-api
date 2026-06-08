import type { ClientSession } from "mongoose";
import { Conflict, NotFound } from "../../shared/utils/appErrors.ts";
import type { IClient } from "./domain/client-interface.ts";
import Client from "./infrastructure/client.ts";

type TypeFilter = {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  active?: boolean;
};

class ClientService {
  private findEmailConflict = async (email: string, ignoreId?: string) => {
    return await Client.findOne({
      email,
      ...(ignoreId && { _id: { $ne: ignoreId } }),
    });
  };

  private buildClientFilter = (query: TypeFilter) => {
    const filter: Record<string, any> = {};

    if (query.name) filter.name = { $regex: query.name, $options: "i" };
    if (query.email) filter.email = { $regex: query.email, $options: "i" };
    if (query.company_name)
      filter.business.company_name = { $regex: query.company_name, $options: "i" };
    if (query.phone) filter.phone = { $regex: query.phone, $options: "i" };
    if (query.active) filter.active = query.active;

    return filter;
  };

  create = async (data: IClient) => {
    const emailConflict = await this.findEmailConflict(data.email);

    if (emailConflict) throw new Conflict("E-mail de cliente já cadastrado.");

    const client = await Client.create(data);

    return client;
  };

  list = async (query: any) => {
    const page = Number(query.page);
    const limit = Number(query.limit);

    const skip = (page - 1) * limit;

    const filter = this.buildClientFilter(query);

    const clients = await Client.find(filter).limit(limit).skip(skip);
    const sizeCollection = await Client.countDocuments(filter);

    return { clients, sizeCollection };
  };

  listOne = async (id: string, session?: ClientSession) => {
    const client = await Client.findById(id).session(session as ClientSession);

    if (!client) throw new NotFound("Cliente não encontrado.");

    return client;
  };

  update = async (data: Partial<IClient>, id: string) => {
    const emailConflict = await this.findEmailConflict(data.email as string, id);
    if (emailConflict) throw new Conflict("E-mail de cliente já cadastrado.");

    const client = await Client.findByIdAndUpdate(id, { ...data }, { new: true });
    if (!client) throw new NotFound("Cliente não encontrado.");

    return client;
  };

  delete = async (id: string) => {
    const client = await Client.findByIdAndUpdate(id, { active: false }, { new: true });

    if (!client) throw new NotFound("Cliente não encontrado.");

    return client;
  };
}

export default new ClientService();
