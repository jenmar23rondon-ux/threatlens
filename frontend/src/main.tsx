import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { io } from "socket.io-client";
import {
  AlertTriangle,
  Database,
  FileJson,
  Globe2,
  LogOut,
  Radar,
  Search,
  Shield,
  Signal
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api, API_URL } from "./services/api";
import type { Alert, DashboardData, Indicator, User } from "./types";
import "./styles.css";

function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState("admin@threatlens.local");
  const [password, setPassword] = useState("Admin1234");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await api.post("/auth/login", { email, password });
      localStorage.setItem("threatlens_token", response.data.token);
      localStorage.setItem("threatlens_user", JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch {
      setError("Could not sign in");
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <Shield size={44} />
        <h1>ThreatLens</h1>
        <p>Threat intelligence and OSINT lookup platform</p>
        {error && <div className="error">{error}</div>}
        <label>Email</label>
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
        <label>Password</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <button>Sign in</button>
      </form>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <section className="stat-card">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </section>
  );
}

function LookupPanel({ onDone }: { onDone: () => void }) {
  const [type, setType] = useState("IP");
  const [value, setValue] = useState("203.0.113.42");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/lookups", { type, value });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel lookup-form" onSubmit={submit}>
      <div>
        <h2>IOC Lookup</h2>
        <p>Search IPs, domains, URLs or hashes against OSINT-style signals.</p>
      </div>
      <label>Type</label>
      <select value={type} onChange={(event) => setType(event.target.value)}>
        <option>IP</option>
        <option>DOMAIN</option>
        <option>URL</option>
        <option>HASH</option>
      </select>
      <label>Indicator</label>
      <input value={value} onChange={(event) => setValue(event.target.value)} />
      <button disabled={loading}>{loading ? "Analyzing..." : "Analyze indicator"}</button>
    </form>
  );
}

function IndicatorTable({ indicators }: { indicators: Indicator[] }) {
  return (
    <section className="panel">
      <h2>Latest Indicators</h2>
      <div className="table">
        <div className="table-row table-head">
          <span>Type</span><span>Value</span><span>Risk</span><span>Source</span><span>Country</span>
        </div>
        {indicators.map((indicator) => (
          <div className="table-row" key={indicator.id}>
            <span>{indicator.type}</span>
            <strong>{indicator.value}</strong>
            <span className={`risk ${indicator.severity.toLowerCase()}`}>{indicator.riskScore}</span>
            <span>{indicator.source}</span>
            <span>{indicator.country || "Unknown"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <section className="panel">
      <h2>Latest Alerts</h2>
      {alerts.length === 0 && <p className="muted">No active threat intelligence alerts yet.</p>}
      {alerts.map((alert) => (
        <article className="alert-card" key={alert.id}>
          <div>
            <strong>{alert.title}</strong>
            <p>{alert.message}</p>
          </div>
          <span className={`risk ${alert.severity.toLowerCase()}`}>{alert.status}</span>
        </article>
      ))}
    </section>
  );
}

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  async function loadData() {
    const [dashboardResponse, indicatorsResponse, alertsResponse] = await Promise.all([
      api.get("/dashboard"),
      api.get("/indicators"),
      api.get("/alerts")
    ]);
    setDashboard(dashboardResponse.data);
    setIndicators(indicatorsResponse.data);
    setAlerts(alertsResponse.data);
  }

  useEffect(() => {
    loadData();
    const socket = io(API_URL);
    socket.on("new-alert", loadData);
    socket.on("new-lookup", loadData);
    return () => {
      socket.disconnect();
    };
  }, []);

  const severityData = useMemo(() => dashboard?.severity || [], [dashboard]);

  return (
    <>
      <nav className="navbar">
        <div className="brand"><Shield size={22} /> ThreatLens</div>
        <a>Dashboard</a>
        <a>Indicators</a>
        <a>Lookup</a>
        <a>Feeds</a>
        <a>Reports</a>
        <span className="spacer" />
        <span className="user">{user.name} ({user.role})</span>
        <button className="logout" onClick={onLogout}><LogOut size={18} /></button>
      </nav>
      <main className="content">
        <section className="hero">
          <div>
            <p className="eyebrow">Threat Intelligence / OSINT</p>
            <h1>IOC reputation and alert enrichment</h1>
            <p>Correlate IPs, domains, URLs and hashes with OSINT-style signals and risk scoring.</p>
          </div>
          <a className="report-button" href={`${API_URL}/reports/indicators.csv`} target="_blank">
            <FileJson size={18} /> Export CSV
          </a>
        </section>

        <div className="stats-grid">
          <StatCard icon={<Database />} label="Total IOCs" value={dashboard?.totalIocs ?? 0} />
          <StatCard icon={<AlertTriangle />} label="High Risk" value={dashboard?.highRiskIocs ?? 0} />
          <StatCard icon={<Signal />} label="Open Alerts" value={dashboard?.openAlerts ?? 0} />
          <StatCard icon={<Globe2 />} label="Sources" value={dashboard?.threatsBySource.length ?? 0} />
        </div>

        <div className="grid-two">
          <LookupPanel onDone={loadData} />
          <section className="panel">
            <h2>Risk by Severity</h2>
            <div className="chart">
              <ResponsiveContainer>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22324d" />
                  <XAxis dataKey="severity" stroke="#9fb3d1" />
                  <YAxis allowDecimals={false} stroke="#9fb3d1" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="grid-two">
          <IndicatorTable indicators={indicators} />
          <AlertsPanel alerts={alerts} />
        </div>

        <section className="panel">
          <h2>Threat Timeline</h2>
          {(dashboard?.latestIndicators || []).map((indicator) => (
            <div className="timeline-row" key={indicator.id}>
              <Radar size={18} />
              <span>{new Date(indicator.lastSeen).toLocaleString()}</span>
              <strong>{indicator.value}</strong>
              <span className={`risk ${indicator.severity.toLowerCase()}`}>{indicator.severity}</span>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("threatlens_user");
    return stored ? JSON.parse(stored) : null;
  });

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        localStorage.removeItem("threatlens_token");
        localStorage.removeItem("threatlens_user");
        setUser(null);
      }}
    />
  );
}

createRoot(document.getElementById("root")!).render(<App />);

