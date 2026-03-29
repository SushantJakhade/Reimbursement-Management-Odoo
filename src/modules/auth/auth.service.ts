import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { DEFAULT_EXPENSE_CATEGORIES } from '../../config/constants';
import { hashPassword, comparePassword } from '../../shared/utils/crypto';
import { getCountryCurrency } from '../../shared/utils/currency';
import { AppError, UnauthorizedError, ConflictError } from '../../shared/middleware/error.middleware';
import { AuthRepository } from './auth.repository';
import { RegisterDto, LoginDto } from './auth.dto';

export class AuthService {
  private repo = new AuthRepository();

  /**
   * Register a new company and admin user
   */
  async register(dto: RegisterDto) {
    // Check if email already used
    const existing = await this.repo.findUserByEmailAcrossCompanies(dto.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // Create slug from company name
    const slug = dto.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Determine default currency from country
    const defaultCurrency = dto.country
      ? await getCountryCurrency(dto.country)
      : 'INR';

    // Hash password
    const passwordHash = await hashPassword(dto.password);

    // Create company + admin + defaults in transaction
    const { company, user } = await this.repo.createCompanyWithAdmin({
      companyName: dto.companyName,
      slug,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      country: dto.country,
      defaultCurrency,
      phone: dto.phone,
      categories: DEFAULT_EXPENSE_CATEGORIES,
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, company.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        defaultCurrency: company.defaultCurrency,
      },
      ...tokens,
    };
  }

  /**
   * Authenticate user and return tokens
   */
  async login(dto: LoginDto) {
    // Find user across all companies
    const user = await this.repo.findUserByEmailAcrossCompanies(dto.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account deactivated. Contact your administrator.');
    }

    // Verify password
    const isValid = await comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await this.repo.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.companyId, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          slug: user.company.slug,
        },
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as any;

      const user = await this.repo.findUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.companyId, user.email, user.role);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.repo.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      designation: user.designation,
      avatar: user.avatar,
      totalPoints: user.totalPoints,
      department: user.department,
      company: {
        id: user.company.id,
        name: user.company.name,
        slug: user.company.slug,
        defaultCurrency: user.company.defaultCurrency,
      },
    };
  }

  private generateTokens(userId: string, companyId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, companyId, email, role },
      env.jwtSecret,
      { expiresIn: env.jwtAccessExpiry as any }
    );

    const refreshToken = jwt.sign(
      { userId, companyId },
      env.jwtRefreshSecret,
      { expiresIn: env.jwtRefreshExpiry as any }
    );

    return { accessToken, refreshToken };
  }
}
