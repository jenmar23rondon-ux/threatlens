import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRoles } from "../../middlewares/auth.middleware";

export const casesRouter = Router();

const caseSchema = z.object({
  title: z.string().min(5),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  indicatorId: z.number().int().positive().optional(),
  notes: z.string().optional()
});

const updateCaseSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "CLOSED"]).optional(),
  notes: z.string().optional()
});

casesRouter.get("", requireAuth, async (_req, res) => {
  const cases = await prisma.threatCase.findMany({
    orderBy: { updatedAt: "desc" },
    include: { indicator: true }
  });
  return res.json(cases);
});

casesRouter.post("", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const payload = caseSchema.parse(req.body);
  const threatCase = await prisma.threatCase.create({
    data: payload,
    include: { indicator: true }
  });
  return res.status(201).json(threatCase);
});

casesRouter.patch("/:id", requireAuth, requireRoles("admin", "analyst"), async (req, res) => {
  const id = Number(req.params.id);
  const payload = updateCaseSchema.parse(req.body);
  const threatCase = await prisma.threatCase.update({
    where: { id },
    data: payload,
    include: { indicator: true }
  });
  return res.json(threatCase);
});
