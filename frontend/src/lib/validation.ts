/**
 * Validation schemas using Zod
 * Provides type-safe input validation for forms and API requests
 */
import { z } from 'zod';

// Common validation patterns
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name cannot exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .max(2048, 'URL cannot exceed 2048 characters');

export const pathSchema = z
  .string()
  .min(1, 'Path is required')
  .max(255, 'Path cannot exceed 255 characters')
  .regex(/^\/[a-zA-Z0-9\/_-]*$/, 'Path must start with / and contain only valid characters');

// Auth schemas
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Project schemas
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s_-]+$/, 'Project name can only contain letters, numbers, spaces, underscores, and hyphens'),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

// Blueprint/Canvas node schemas
export const routeNodeSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: pathSchema,
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
});

export const databaseNodeSchema = z.object({
  provider: z.enum(['postgres', 'mongodb', 'sqlite']),
  model: z
    .string()
    .min(1, 'Model name is required')
    .max(50, 'Model name cannot exceed 50 characters')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Model name must start with a letter and contain only letters, numbers, and underscores'),
  action: z.enum(['findAll', 'findOne', 'create', 'update', 'delete']),
});

export const authNodeSchema = z.object({
  strategy: z.enum(['jwt', 'api_key', 'none']),
  secret_env_var: z
    .string()
    .max(100, 'Environment variable name cannot exceed 100 characters')
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Environment variable must be uppercase with underscores')
    .optional(),
});

// Export types for TypeScript
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type RouteNodeData = z.infer<typeof routeNodeSchema>;
export type DatabaseNodeData = z.infer<typeof databaseNodeSchema>;
export type AuthNodeData = z.infer<typeof authNodeSchema>;

/**
 * Validate data against a schema and return either success or error
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data, errors: null };
  }
  
  return {
    success: false,
    data: null,
    errors: result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  };
}