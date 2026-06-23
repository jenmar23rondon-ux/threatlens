import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const watchlistRouter = Router();

const watchlistSchema = z.object({
  indicatorId: z.number().int().positive(),
  reason: z.string().min(5)
});

watchlistRouter.get("", requireAuth, async (_req, res) => {
  const items = await prisma.watchlistItem.findMany({
    orderBy: { createdAt: "desc" },
    include: { indicator: true }
  });
  return res.json(items);
});

watchlistRouter.post("", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const payload = watchlistSchema.parse(req.body);
  const item = await prisma.watchlistItem.upsert({
    where: { indicatorId: payload.indicatorId },
    update: { reason: payload.reason, active: true },
    create: payload,
    include: { indicator: true }
  });
  return res.status(201).json(item);
});

watchlistRouter.patch("/:id/toggle", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const id = Number(req.params.id);
  const current = await prisma.watchlistItem.findUniqueOrThrow({ where: { id } });
  const item = await prisma.watchlistItem.update({
    where: { id },
    data: { active: !current.active },
    include: { indicator: true }
  });
  return res.json(item);
});
