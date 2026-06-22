import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { signToken } from "../../utils/jwt";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  role: z.enum(["admin", "analyst", "viewer"]).default("analyst")
});

authRouter.post("/login", async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: payload.email } });
  if (!user || !(await bcrypt.compare(payload.password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({
    token: signToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

authRouter.post("/register", requireAuth, requireRoles("admin"), async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const password = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({ data: { ...payload, password } });
  return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

