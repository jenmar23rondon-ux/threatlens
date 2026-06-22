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

lookupsRouter.post("", requireAuth, requireRoles("admin", "analyst"), async (req: AuthRequest, res) => {
  const payload = lookupSchema.parse(req.body);
  const analysis = await analyzeIndicator(payload.type, payload.value);

  const indicator = await prisma.indicator.upsert({
    where: { value: payload.value },
    update: {
      type: payload.type,
      riskScore: analysis.riskScore,
      severity: analysis.severity,
      source: analysis.sources.join(", "),
      country: analysis.country,
      asn: analysis.asn,
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
      tags: analysis.tags
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

