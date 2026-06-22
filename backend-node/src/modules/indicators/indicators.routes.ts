import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth.middleware";

export const indicatorsRouter = Router();

indicatorsRouter.get("", requireAuth, async (_req, res) => {
  const indicators = await prisma.indicator.findMany({
    orderBy: [{ severity: "desc" }, { lastSeen: "desc" }],
    take: 100
  });
  return res.json(indicators);
});

