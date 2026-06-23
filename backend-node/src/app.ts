import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { isAllowedOrigin } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { alertsRouter } from "./modules/alerts/alerts.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { casesRouter } from "./modules/cases/cases.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { feedsRouter } from "./modules/feeds/feeds.routes";
import { indicatorsRouter } from "./modules/indicators/indicators.routes";
import { lookupsRouter } from "./modules/lookups/lookups.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { watchlistRouter } from "./modules/watchlist/watchlist.routes";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({ name: "ThreatLens API", status: "ok" });
});

app.use("/auth", authRouter);
app.use("/lookups", lookupsRouter);
app.use("/indicators", indicatorsRouter);
app.use("/alerts", alertsRouter);
app.use("/feeds", feedsRouter);
app.use("/watchlist", watchlistRouter);
app.use("/cases", casesRouter);
app.use("/dashboard", dashboardRouter);
app.use("/reports", reportsRouter);

app.use(errorMiddleware);
