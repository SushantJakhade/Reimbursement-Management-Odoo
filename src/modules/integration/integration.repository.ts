import prisma from '../../config/database';

export class IntegrationRepository {
  async create(data: any) {
    return prisma.integration.create({ data });
  }

  async findById(id: string, companyId: string) {
    return prisma.integration.findFirst({ where: { id, companyId } });
  }

  async findMany(companyId: string) {
    return prisma.integration.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return prisma.integration.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.integration.delete({ where: { id } });
  }
}
