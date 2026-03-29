import { Response } from 'express';

/**
 * Standard API success response
 */
export function successResponse(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standard API error response
 */
export function errorResponse(res: Response, message: string, statusCode: number = 400, errors?: any) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

/**
 * Standard API created response
 */
export function createdResponse(res: Response, data: any, message: string = 'Created successfully') {
  return successResponse(res, data, message, 201);
}

/**
 * No content response
 */
export function noContentResponse(res: Response) {
  return res.status(204).send();
}
