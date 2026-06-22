import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth.middleware";

export const dashboardRouter = Router();

dashboardRouter.get("", requireAuth, async (_req, res) => {
  const [totalIocs, highRiskIocs, openAlerts, latestAlerts, latestIndicators, sources] = await Promise.all([
    prisma.indicator.count(),
    prisma.indicator.count({ where: { severity: "HIGH" } }),
    prisma.alert.count({ where: { status: "OPEN" } }),
    prisma.alert.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { indicator: true } }),
    prisma.indicator.findMany({ orderBy: { lastSeen: "desc" }, take: 8 }),
    prisma.indicator.groupBy({ by: ["source"], _count: { _all: true } })
  ]);

  const severity = await prisma.indicator.groupBy({ by: ["severity"], _count: { _all: true } });
  const countries = await prisma.indicator.groupBy({
    by: ["country"],
    _count: { _all: true },
    where: { country: { not: null } },
    orderBy: { _count: { country: "desc" } },
    take: 8
  });

  return res.json({
    totalIocs,
    highRiskIocs,
    openAlerts,
    latestAlerts,
    latestIndicators,
    threatsBySource: sources.map((item) => ({ source: item.source, count: item._count._all })),
    severity: severity.map((item) => ({ severity: item.severity, count: item._count._all })),
    riskByCountry: countries.map((item) => ({ country: item.country || "Unknown", count: item._count._all }))
  });
});
