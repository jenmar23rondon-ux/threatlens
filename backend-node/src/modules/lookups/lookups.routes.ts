import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { emitEvent } from "../../config/socket";
import { requireAuth, requireRoles, AuthRequest } from "../../middlewares/auth.middleware";
import { analyzeIndicator } from "./python-analyzer.service";

export const lookupsRouter = Router();

const lookupSchema = z.object({
  type: z.enum(["IP", "DOMAIN", "URL", "HASH"]),
  value: z.string().min(3)
});

function inferMitreTechnique(type: string, tags: string[]) {
  const normalized = tags.join(" ").toLowerCase();
  if (normalized.includes("phishing") || type === "URL") return "T1566 - Phishing";
  if (normalized.includes("malware") || type === "HASH") return "T1204 - User Execution";
  if (normalized.includes("botnet") || normalized.includes("abuse")) return "T1071 - Application Layer Protocol";
  if (type === "DOMAIN") return "T1568 - Dynamic Resolution";
  return "T1595 - Active Scanning";
}

lookupsRouter.post("", requireAuth, requireRoles("admin", "analyst"), async (req: AuthRequest, res) => {
  const payload = lookupSchema.parse(req.body);
  const analysis = await analyzeIndicator(payload.type, payload.value);
  const mitreTechnique = inferMitreTechnique(payload.type, analysis.tags);

  const indicator = await prisma.indicator.upsert({
    where: { value: payload.value },
    update: {
      type: payload.type,
      riskScore: analysis.riskScore,
      severity: analysis.severity,
      source: analysis.sources.join(", "),
      country: analysis.country,
      asn: analysis.asn,
      mitreTechnique,
      tags: analysis.tags,
      lastSeen: new Date()
    },
    create: {
      type: payload.type,
      value: payload.value,
      riskScore: analysis.riskScore,
      severity: analysis.severity,
      source: analysis.sources.join(", "),
      country: analysis.country,
      asn: analysis.asn,
      mitreTechnique,
      tags: analysis.tags
    }
  });

  await prisma.reputationSnapshot.create({
    data: {
      indicatorId: indicator.id,
      riskScore: analysis.riskScore,
      severity: analysis.severity,
      sources: analysis.sources,
      summary: analysis.summary
    }
  });

  const lookup = await prisma.lookup.create({
    data: {
      query: payload.value,
      result: analysis,
      indicatorId: indicator.id,
      userId: req.user?.id
    }
  });

  let alert = null;
  if (analysis.riskScore >= 71) {
    alert = await prisma.alert.create({
      data: {
        title: `High-risk IOC detected: ${payload.value}`,
        message: analysis.summary,
        severity: "HIGH",
        indicatorId: indicator.id
      }
    });
    emitEvent("new-alert", alert);
  }

  emitEvent("new-lookup", { lookup, indicator });
  return res.status(201).json({ lookup, indicator, analysis, alert });
});

lookupsRouter.get("", requireAuth, async (_req, res) => {
  const lookups = await prisma.lookup.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { indicator: true }
  });
  return res.json(lookups);
});

lookupsRouter.get("/:indicatorId/history", requireAuth, async (req, res) => {
  const indicatorId = Number(req.params.indicatorId);
  const history = await prisma.reputationSnapshot.findMany({
    where: { indicatorId },
    orderBy: { createdAt: "desc" },
    take: 25
  });
  return res.json(history);
});
