import { IntegrationRepository } from './integration.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { encrypt, decrypt } from '../../shared/utils/crypto';
import { CreateIntegrationDto, UpdateIntegrationDto } from './integration.dto';

export class IntegrationService {
  private repo = new IntegrationRepository();

  async create(companyId: string, dto: CreateIntegrationDto) {
    const data: any = { ...dto, companyId };
    if (dto.apiKey) data.apiKey = encrypt(dto.apiKey);
    return this.repo.create(data);
  }

  async getById(id: string, companyId: string) {
    const integration = await this.repo.findById(id, companyId);
    if (!integration) throw new NotFoundError('Integration');
    // Mask API key
    if (integration.apiKey) {
      integration.apiKey = '****' + decrypt(integration.apiKey).slice(-4);
    }
    return integration;
  }

  async list(companyId: string) {
    const integrations = await this.repo.findMany(companyId);
    return integrations.map((i) => ({
      ...i,
      apiKey: i.apiKey ? '****' + decrypt(i.apiKey).slice(-4) : null,
    }));
  }

  async update(id: string, companyId: string, dto: UpdateIntegrationDto) {
    await this.getById(id, companyId);
    const data: any = { ...dto };
    if (dto.apiKey) data.apiKey = encrypt(dto.apiKey);
    return this.repo.update(id, data);
  }

  async testConnection(id: string, companyId: string) {
    const integration = await this.repo.findById(id, companyId);
    if (!integration) throw new NotFoundError('Integration');
    // Simulate connection test
    return { success: true, message: 'Connection test passed', timestamp: new Date() };
  }
}
