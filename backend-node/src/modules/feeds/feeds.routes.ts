import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const feedsRouter = Router();

const feedSchema = z.object({
  name: z.string().min(2),
  sourceUrl: z.string().url().optional()
});

const importSchema = z.object({
  name: z.string().min(2),
  indicators: z.array(z.object({
    type: z.enum(["IP", "DOMAIN", "URL", "HASH"]),
    value: z.string().min(3),
    source: z.string().default("manual-feed"),
    tags: z.array(z.string()).default([])
  })).min(1)
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

feedsRouter.post("/import", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const payload = importSchema.parse(req.body);
  const feed = await prisma.threatFeed.upsert({
    where: { name: payload.name },
    update: { enabled: true },
    create: { name: payload.name }
  });

  const indicators = await Promise.all(payload.indicators.map((item) =>
    prisma.indicator.upsert({
      where: { value: item.value },
      update: {
        type: item.type,
        source: item.source,
        tags: item.tags,
        lastSeen: new Date()
      },
      create: {
        type: item.type,
        value: item.value,
        source: item.source,
        tags: item.tags
      }
    })
  ));

  return res.status(201).json({ feed, imported: indicators.length });
});
