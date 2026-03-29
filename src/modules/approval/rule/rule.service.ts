import { RuleRepository } from './rule.repository';
import { NotFoundError } from '../../../shared/middleware/error.middleware';
import { CreateRuleDto, UpdateRuleDto, AddStepDto } from './rule.dto';

export class RuleService {
  private repo = new RuleRepository();

  async create(companyId: string, dto: CreateRuleDto) {
    return this.repo.create(companyId, dto);
  }

  async getById(id: string, companyId: string) {
    const rule = await this.repo.findById(id, companyId);
    if (!rule) throw new NotFoundError('Approval Rule');
    return rule;
  }

  async list(companyId: string) {
    return this.repo.findMany(companyId);
  }

  async update(id: string, companyId: string, dto: UpdateRuleDto) {
    await this.getById(id, companyId);
    return this.repo.update(id, dto);
  }

  async addStep(ruleId: string, companyId: string, dto: AddStepDto) {
    await this.getById(ruleId, companyId);
    return this.repo.addStep(ruleId, dto);
  }

  async updateStep(ruleId: string, stepId: string, companyId: string, data: any) {
    await this.getById(ruleId, companyId);
    return this.repo.updateStep(stepId, data);
  }

  async deleteStep(ruleId: string, stepId: string, companyId: string) {
    await this.getById(ruleId, companyId);
    return this.repo.deleteStep(stepId);
  }
}
