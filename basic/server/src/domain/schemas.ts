import { z } from "zod";
import { config } from "../config.js";
import { AppError } from "./errors.js";

/**
 * Request shapes, validated with Zod. Routes call parse() and get a typed,
 * trusted object or an AppError the error handler already knows how to render.
 *
 * A select in the client is a convenience for the person filling it in — these
 * schemas are what actually decide whether a request is allowed to proceed.
 */

export const TASK_STATUSES = ["open", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

const isoDate = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be 32 characters or fewer.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dot, underscore or hyphen."),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(config.minPasswordLength, `Password must be at least ${config.minPasswordLength} characters.`),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your email or username."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const listCreateSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name.").max(120),
});

export const listUpdateSchema = z.object({
  name: z.string().trim().min(1, "Give the list a name.").max(120),
});

export const taskCreateSchema = z.object({
  list_id: z.string().min(1, "list_id is required."),
  title: z.string().trim().min(1, "Give the task a title.").max(200),
  notes: z.string().trim().max(2000).nullish(),
  priority: z.number().int().min(1).max(3).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  due_at: isoDate.nullish(),
});
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;

// Partial update: every field optional, but at least one must be present.
// `.strict()` rejects unknown keys, which is the guard against mass assignment.
export const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    notes: z.string().trim().max(2000).nullable(),
    priority: z.number().int().min(1).max(3),
    status: z.enum(TASK_STATUSES),
    due_at: isoDate.nullable(),
  })
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "Send at least one field to update.",
  });
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

/** Parses `data` or throws a 400 whose details name each bad field. */
export function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const details: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "body";
    details[key] ??= issue.message;
  }
  throw AppError.badRequest("Some fields need attention.", details);
}
