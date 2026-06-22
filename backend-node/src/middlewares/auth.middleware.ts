import { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { verifyToken } from "../utils/jwt";

export type AuthRequest = Request & {
  user?: { id: number; email: string; role: UserRole };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = verifyToken(header.replace("Bearer ", ""));
    req.user = { id: Number(payload.sub), email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

