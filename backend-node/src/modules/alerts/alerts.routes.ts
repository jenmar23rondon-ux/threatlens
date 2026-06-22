import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const alertsRouter = Router();

const statusSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"])
});

alertsRouter.get("", requireAuth, async (_req, res) => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { indicator: true }
  });
  return res.json(alerts);
});

alertsRouter.patch("/:id/status", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const payload = statusSchema.parse(req.body);
  const alert = await prisma.alert.update({
    where: { id: Number(req.params.id) },
    data: { status: payload.status }
  });
  return res.json(alert);
});

