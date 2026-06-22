export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
};

export type Indicator = {
  id: number;
  type: "IP" | "DOMAIN" | "URL" | "HASH";
  value: string;
  riskScore: number;
  severity: "LOW" | "MEDIUM" | "HIGH";
  source: string;
  country?: string;
  asn?: string;
  tags: string[];
  lastSeen: string;
};

export type Alert = {
  id: number;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  createdAt: string;
  indicator?: Indicator;
};

export type DashboardData = {
  totalIocs: number;
  highRiskIocs: number;
  openAlerts: number;
  latestAlerts: Alert[];
  latestIndicators: Indicator[];
  threatsBySource: { source: string; count: number }[];
  severity: { severity: string; count: number }[];
  riskByCountry: { country: string; count: number }[];
};

