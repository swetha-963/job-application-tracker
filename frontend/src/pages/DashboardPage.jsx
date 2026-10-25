import { useEffect, useState } from "react";
import { ArrowRight, Briefcase, CalendarDays, CheckCircle2, Clock3, MapPin, TrendingUp, Trophy, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { api, errorMessage } from "../api/client";
import { ChartPanel, EmptyState, Loading, PageHeader, StatCard, StatusBadge, formatDateTime } from "../components/Ui";

const palette = ["#0c7673", "#72b7a2", "#a6d8c5", "#6c7ea5", "#ddaa64", "#cc7c6e", "#a2a8a2"];

function ChartEmpty() {
  return <div className="chart-empty">Your chart will come to life as you track applications.</div>;
}

export default function DashboardPage() {
  const [range, setRange] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/dashboard/stats/", { params: { range } })
      .then((response) => { if (active) setData(response.data); })
      .catch((error) => { if (active) toast.error(errorMessage(error, "Could not load dashboard data.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  if (loading && !data) return <Loading label="Gathering your job search data..." />;

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recent = data?.recent_applications || [];
  const interviews = data?.upcoming_interviews || [];
  const reminders = data?.upcoming_reminders || [];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
        title="Your search, in focus."
        description="A clear view of the work you're putting in and what's coming next."
        action={<div className="range-switcher" aria-label="Dashboard date range">
          {[["7d", "7 days"], ["30d", "30 days"], ["6m", "6 months"], ["all", "All time"]].map(([key, label]) => <button key={key} className={range === key ? "selected" : ""} onClick={() => setRange(key)}>{label}</button>)}
        </div>}
      />

      <section className="stats-grid">
        <StatCard icon={Briefcase} label="Total applications" value={summary.total_applications} hint={range === "all" ? "Across your full search" : "In the selected period"} tone="teal" />
        <StatCard icon={TrendingUp} label="Submitted this month" value={summary.submitted_this_month} hint="Your recent momentum" tone="blue" />
        <StatCard icon={CalendarDays} label="Upcoming interviews" value={summary.upcoming_interviews} hint="Scheduled and still ahead" tone="violet" />
        <StatCard icon={Trophy} label="Offers received" value={summary.offers_received} hint="A milestone worth celebrating" tone="gold" />
        <StatCard icon={XCircle} label="Rejected" value={summary.rejected_applications} hint="Keep learning from each one" tone="rose" />
      </section>

      <section className="dashboard-grid dashboard-charts">
        <ChartPanel title="Application status" subtitle="Where each opportunity stands">
          {(charts.status || []).some((item) => item.count > 0) ? (
            <div className="chart-with-legend">
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart><Pie data={charts.status} dataKey="count" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} stroke="none">
                    {(charts.status || []).map((entry, index) => <Cell key={entry.key} fill={palette[index % palette.length]} />)}
                  </Pie><Tooltip /></PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><strong>{summary.total_applications || 0}</strong><span>roles</span></div>
              </div>
              <div className="chart-legend">
                {(charts.status || []).filter((item) => item.count > 0).map((item) => <div key={item.key}><i style={{ background: palette[(charts.status || []).indexOf(item) % palette.length] }} /><span>{item.name}</span><strong>{item.count}</strong></div>)}
              </div>
            </div>
          ) : <ChartEmpty />}
        </ChartPanel>

        <ChartPanel title="Monthly application trend" subtitle="Applications submitted over the last 6 months">
          {(charts.monthly || []).some((item) => item.count > 0) ? (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={238}>
                <LineChart data={charts.monthly} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)" }} />
                  <Line type="monotone" dataKey="count" stroke="#0c7673" strokeWidth={3} dot={{ fill: "#0c7673", stroke: "#fff", strokeWidth: 3, r: 5 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmpty />}
        </ChartPanel>

        <ChartPanel title="Search regions" subtitle="Applications across India and the Gulf">
          {(charts.locations || []).some((item) => item.count > 0) ? (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.locations} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "var(--soft)" }} />
                  <Bar dataKey="count" fill="#72b7a2" radius={[7, 7, 0, 0]} barSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmpty />}
        </ChartPanel>

        <ChartPanel title="Roles you're exploring" subtitle="Most frequently applied-for titles">
          {(charts.roles || []).length ? (
            <div className="chart-frame">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts.roles} layout="vertical" margin={{ top: 8, right: 10, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="var(--line)" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={122} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                  <Tooltip cursor={{ fill: "var(--soft)" }} />
                  <Bar dataKey="count" fill="#6c7ea5" radius={[0, 7, 7, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <ChartEmpty />}
        </ChartPanel>
      </section>

      <section className="dashboard-grid dashboard-bottom">
        <ChartPanel title="Recent applications" subtitle="Your latest updates" action={<Link className="text-link" to="/applications">View all <ArrowRight size={14} /></Link>}>
          {recent.length ? (
            <div className="recent-list">
              {recent.map((application) => (
                <Link className="recent-row" to={"/applications/" + application.id} key={application.id}>
                  <div className="company-avatar">{(application.company_name || "C").slice(0, 1).toUpperCase()}</div>
                  <div className="recent-role"><strong>{application.title}</strong><span>{application.company_name} <i>|</i> {application.city || application.country || "Location not set"}</span></div>
                  <StatusBadge status={application.status} />
                </Link>
              ))}
            </div>
          ) : <EmptyState title="Your list starts here" description="Add an application to keep the important details in one place." action={<Link className="button button-primary button-small" to="/applications?create=1">Add first application</Link>} />}
        </ChartPanel>

        <div className="side-stack">
          <ChartPanel title="Coming up" subtitle="Your next interviews">
            {interviews.length ? <div className="compact-list">{interviews.map((item) => (
              <div className="compact-row" key={item.id}><div className="compact-icon"><CalendarDays size={17} /></div><div><strong>{item.round} interview</strong><span>{item.application_title} | {item.company_name}</span><small>{formatDateTime(item.scheduled_at)}</small></div></div>
            ))}</div> : <EmptyState title="No interviews scheduled" description="Add an interview to see it here." />}
          </ChartPanel>
          <ChartPanel title="Reminders" subtitle="Your next gentle nudges">
            {reminders.length ? <div className="compact-list">{reminders.map((item) => (
              <div className="compact-row" key={item.id}><div className="compact-icon reminder-icon"><Clock3 size={17} /></div><div><strong>{item.title}</strong><span>{item.application_title || item.reminder_type.replaceAll("_", " ")}</span><small>{formatDateTime(item.due_at)}</small></div></div>
            ))}</div> : <EmptyState title="Nothing on the list" description="Create a follow-up or deadline reminder." />}
          </ChartPanel>
        </div>
      </section>
      <section className="conversion-strip">
        <div><div className="conversion-icon"><TrendingUp size={18} /></div><span>Interview rate</span><strong>{data?.conversion?.interview_rate ?? 0}%</strong><small>Applications currently at interview or offer status</small></div>
        <div><div className="conversion-icon conversion-gold"><CheckCircle2 size={18} /></div><span>Offer rate</span><strong>{data?.conversion?.offer_rate ?? 0}%</strong><small>Offers divided by non-saved applications</small></div>
        <div className="conversion-note"><MapPin size={17} /><span>Conversion rates use current application status and exclude saved roles.</span></div>
      </section>
    </div>
  );
}
