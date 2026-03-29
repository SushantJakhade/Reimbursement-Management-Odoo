import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/response';

/**
 * Validation middleware factory using Zod schemas
 *
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 *
 * @example
 * router.post('/', validate(createExpenseSchema), handler);
 * router.get('/', validate(listQuerySchema, 'query'), handler);
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[source]);
      // Replace with parsed/coerced values
      req[source] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return errorResponse(res, 'Validation failed', 422, formattedErrors);
      }

      next(error);
    }
  };
}
