import { Router } from "express";
import { prisma } from "../../config/prisma";
import { requireAuth } from "../../middlewares/auth.middleware";

export const reportsRouter = Router();

reportsRouter.get("/indicators.csv", requireAuth, async (_req, res) => {
  const indicators = await prisma.indicator.findMany({ orderBy: { lastSeen: "desc" } });
  const rows = [
    "type,value,riskScore,severity,source,country,asn,lastSeen",
    ...indicators.map((item) =>
      [
        item.type,
        item.value,
        item.riskScore,
        item.severity,
        item.source,
        item.country || "",
        item.asn || "",
        item.lastSeen.toISOString()
      ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
  ];
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=threatlens-indicators.csv");
  return res.send(rows.join("\n"));
});

reportsRouter.get("/summary.json", requireAuth, async (_req, res) => {
  const indicators = await prisma.indicator.findMany({ orderBy: { lastSeen: "desc" }, take: 100 });
  const alerts = await prisma.alert.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return res.json({ generatedAt: new Date().toISOString(), indicators, alerts });
});

