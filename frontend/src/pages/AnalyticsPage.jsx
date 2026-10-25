import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";
import { api, errorMessage } from "../api/client";
import { ChartPanel, Loading, PageHeader } from "../components/Ui";

const colors = ["#0c7673", "#72b7a2", "#a6d8c5", "#6c7ea5", "#ddaa64", "#cc7c6e", "#a2a8a2"];

export default function AnalyticsPage() {
  const [range, setRange] = useState("6m");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.get("/dashboard/stats/", { params: { range } })
      .then((response) => { if (active) setData(response.data); })
      .catch((error) => { if (active) toast.error(errorMessage(error, "Could not load analytics.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  if (loading && !data) return <Loading label="Calculating your search insights..." />;
  const charts = data?.charts || {};

  return (
    <div className="page-stack">
      <PageHeader eyebrow="A CLEARER PICTURE" title="Search analytics" description="Use your activity to understand what is moving and where to focus." action={<div className="range-switcher">{[["7d", "7 days"], ["30d", "30 days"], ["6m", "6 months"], ["all", "All time"]].map(([key, label]) => <button key={key} className={range === key ? "selected" : ""} onClick={() => setRange(key)}>{label}</button>)}</div>} />
      <section className="analytics-summary-grid">
        <article className="panel analytics-metric"><span>Applications in range</span><strong>{data?.summary?.total_applications || 0}</strong><small>Selected date window</small></article>
        <article className="panel analytics-metric"><span>Interview rate</span><strong>{data?.conversion?.interview_rate || 0}%</strong><small>Current interview or offer status</small></article>
        <article className="panel analytics-metric"><span>Offer rate</span><strong>{data?.conversion?.offer_rate || 0}%</strong><small>Offers / non-saved applications</small></article>
        <article className="panel analytics-metric"><span>Conversion base</span><strong>{data?.conversion?.denominator || 0}</strong><small>Saved roles excluded</small></article>
      </section>
      <section className="analytics-grid">
        <ChartPanel title="Monthly activity" subtitle="Applications submitted over the last 6 months">
          <ResponsiveContainer width="100%" height={300}><LineChart data={charts.monthly || []} margin={{ top: 20, right: 16, left: -14, bottom: 5 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="count" stroke="#0c7673" strokeWidth={3} dot={{ r: 5, fill: "#0c7673" }} /></LineChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Pipeline health" subtitle="Current status of tracked applications">
          <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={charts.status || []} dataKey="count" nameKey="name" innerRadius={62} outerRadius={108} paddingAngle={3} stroke="none">{(charts.status || []).map((item, index) => <Cell key={item.key} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          <div className="analytics-legend">{(charts.status || []).map((item, index) => <span key={item.key}><i style={{ background: colors[index % colors.length] }} />{item.name}: <b>{item.count}</b></span>)}</div>
        </ChartPanel>
        <ChartPanel title="Location mix" subtitle="Where opportunities are based">
          <ResponsiveContainer width="100%" height={280}><BarChart data={charts.locations || []} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#72b7a2" radius={[8, 8, 0, 0]} barSize={48} /></BarChart></ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Popular roles" subtitle="Titles you have applied for most">
          <ResponsiveContainer width="100%" height={280}><BarChart data={charts.roles || []} layout="vertical" margin={{ top: 8, right: 14, left: 8, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="var(--line)" /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis type="category" dataKey="name" width={136} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip /><Bar dataKey="count" fill="#6c7ea5" radius={[0, 8, 8, 0]} barSize={24} /></BarChart></ResponsiveContainer>
        </ChartPanel>
      </section>
      <p className="analytics-footnote">Conversion rates use the current application status. The denominator includes every non-saved application in the selected date range.</p>
    </div>
  );
}
