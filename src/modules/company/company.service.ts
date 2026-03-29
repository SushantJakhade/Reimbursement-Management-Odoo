import { CompanyRepository } from './company.repository';
import { NotFoundError } from '../../shared/middleware/error.middleware';
import { UpdateCompanyDto } from './company.dto';

export class CompanyService {
  private repo = new CompanyRepository();

  async getCompany(companyId: string) {
    const company = await this.repo.findById(companyId);
    if (!company) throw new NotFoundError('Company');
    return company;
  }

  async updateCompany(companyId: string, dto: UpdateCompanyDto) {
    return this.repo.update(companyId, dto);
  }

  async getStats(companyId: string) {
    return this.repo.getStats(companyId);
  }
}
