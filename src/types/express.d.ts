import { UserRole } from '@prisma/client';

// Override Express query type to simplify usage
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId: string;
        email: string;
        role: UserRole;
      };
      companyId?: string;
    }
  }
}

// Override qs ParsedQs to treat query params as string
declare module 'qs' {
  interface ParsedQs {
    [key: string]: string | undefined;
  }
}

export {};
