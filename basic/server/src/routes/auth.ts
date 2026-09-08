import { Router } from "express";
import { AppError } from "../domain/errors.js";
import { hashPassword, verifyPassword } from "../domain/passwords.js";
import { loginSchema, parse, registerSchema } from "../domain/schemas.js";
import { clearSessionCookie, setSessionCookie } from "../lib/cookies.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { config } from "../config.js";
import { createSession, deleteSession } from "../repositories/sessions.js";
import { createUser, findUserByEmail, findUserByUsername, toPublicUser } from "../repositories/users.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler((req, res) => {
    const input = parse(registerSchema, req.body);

    const conflicts: Record<string, string> = {};
    if (findUserByUsername(input.username)) conflicts.username = "That username is taken.";
    if (findUserByEmail(input.email)) conflicts.email = "That email is already registered.";
    if (Object.keys(conflicts).length > 0) {
      throw AppError.conflict("Those details are already in use.", conflicts);
    }

    const user = createUser({
      username: input.username,
      email: input.email,
      passwordHash: hashPassword(input.password),
    });

    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.status(201).json({ user: toPublicUser(user) });
  }),
);

authRouter.post(
  "/login",
  asyncHandler((req, res) => {
    const input = parse(loginSchema, req.body);

    const row = input.identifier.includes("@")
      ? findUserByEmail(input.identifier)
      : findUserByUsername(input.identifier);

    // The same answer for a wrong password and an unknown account: the endpoint
    // must not become a way to discover who has registered.
    if (!row || !verifyPassword(input.password, row.password_hash)) {
      throw AppError.unauthorized("Email or password is incorrect.");
    }

    const session = createSession(row.id);
    setSessionCookie(res, session.token, session.expiresAt);
    res.json({ user: toPublicUser(row) });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler((req, res) => {
    deleteSession(req.cookies?.[config.sessionCookie] as string | undefined);
    clearSessionCookie(res);
    res.status(204).end();
  }),
);

authRouter.get(
  "/me",
  asyncHandler((req, res) => {
    res.json({ user: req.user });
  }),
);
