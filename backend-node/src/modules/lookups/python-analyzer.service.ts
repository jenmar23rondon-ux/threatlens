import axios from "axios";
import { IndicatorType } from "@prisma/client";
import { env } from "../../config/env";

export type AnalyzerResponse = {
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  sources: string[];
  tags: string[];
  country?: string;
  asn?: string;
  summary: string;
};

export async function analyzeIndicator(type: IndicatorType, value: string): Promise<AnalyzerResponse> {
  try {
    const response = await axios.post(`${env.analyzerUrl}/analyze`, { type, value }, { timeout: 10000 });
    return response.data;
  } catch {
    const suspicious = /(malware|phish|bad|evil|attack|185\.|45\.)/i.test(value);
    return {
      riskScore: suspicious ? 82 : 18,
      severity: suspicious ? "HIGH" : "LOW",
      sources: ["local-fallback"],
      tags: suspicious ? ["suspicious-pattern"] : ["clean-demo"],
      country: suspicious ? "Unknown" : "Global",
      asn: "demo-asn",
      summary: "Local fallback risk scoring used because the analyzer service was unavailable."
    };
  }
}

