import { config } from "../../config.js";
import {
  createSession,
  deleteSession,
} from "../../db/repositories/sessions.js";
import { createUser, findUserByEmail, serialiseUser } from "../../db/repositories/users.js";
import { AppError } from "../../domain/errors.js";
import { hashPassword, verifyPassword } from "../../domain/passwords.js";
import { requireObject, requireString } from "../../domain/validate.js";
import {
  clearSessionCookie,
  currentUser,
  readJsonBody,
  sessionTokenFrom,
  setSessionCookie,
} from "../middleware.js";
import { sendJson, sendNoContent } from "../respond.js";

// Deliberately permissive: enough to catch a typo, not a spec implementation.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function credentials(body) {
  requireObject(body);
  const email = requireString(body.email, "email", { max: 320 });
  if (!EMAIL.test(email)) throw AppError.badRequest("Enter a valid email address.");

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < config.minPasswordLength) {
    throw AppError.badRequest(
      `Password must be at least ${config.minPasswordLength} characters.`,
    );
  }

  return { email, password };
}

export function registerAuthRoutes(router) {
  router.post("/auth/register", async ({ req, res }) => {
    const body = await readJsonBody(req);
    const { email, password } = credentials(body);
    const displayName = requireString(body.display_name ?? email.split("@")[0], "display_name", {
      max: 80,
    });

    if (findUserByEmail(email)) {
      throw AppError.conflict("That email is already registered.");
    }

    const user = createUser({
      email,
      passwordHash: hashPassword(password),
      displayName,
    });

    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    sendJson(res, 201, { user: serialiseUser(user) });
  });

  router.post("/auth/login", async ({ req, res }) => {
    const body = await readJsonBody(req);
    requireObject(body);

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = findUserByEmail(email);

    // Same message either way: never confirm which half was wrong.
    if (!user || !verifyPassword(password, user.password_hash)) {
      throw AppError.unauthorized("Email or password is incorrect.");
    }

    const session = createSession(user.id);
    setSessionCookie(res, session.token, session.expiresAt);
    sendJson(res, 200, { user: serialiseUser(user) });
  });

  router.post("/auth/logout", async ({ req, res }) => {
    deleteSession(sessionTokenFrom(req));
    clearSessionCookie(res);
    sendNoContent(res);
  });

  router.get("/auth/me", async ({ req, res }) => {
    const user = currentUser(req);
    sendJson(res, 200, { user: user ? serialiseUser(user) : null });
  });
}
