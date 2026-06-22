import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const feedsRouter = Router();

const feedSchema = z.object({
  name: z.string().min(2),
  sourceUrl: z.string().url().optional()
});

feedsRouter.get("", requireAuth, async (_req, res) => {
  const feeds = await prisma.threatFeed.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(feeds);
});

feedsRouter.post("", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const payload = feedSchema.parse(req.body);
  const feed = await prisma.threatFeed.create({ data: payload });
  return res.status(201).json(feed);
});

