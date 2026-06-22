import jwt, { SignOptions } from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";

export function signToken(user: { id: number; email: string; role: UserRole }) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as unknown as { sub: number; email: string; role: UserRole };
}
