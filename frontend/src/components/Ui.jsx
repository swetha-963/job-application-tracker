import { LoaderCircle, Plus } from "lucide-react";

export function PageHeader({ eyebrow, title, description, action, children }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <div className="page-title-row">
          <h1>{title}</h1>
          {children}
        </div>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon = Plus, title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Loading({ label = "Loading your data..." }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={20} /><span>{label}</span></div>;
}

export function StatusBadge({ status }) {
  const label = String(status || "saved").replaceAll("_", " ");
  return <span className={"status-badge status-" + String(status || "saved")}>{label}</span>;
}

export function StatCard({ icon: Icon, label, value, hint, tone = "teal" }) {
  return (
    <article className="stat-card">
      <div className={"stat-icon stat-" + tone}><Icon size={19} /></div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value ?? 0}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

export function Modal({ title, description, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={"modal-card" + (wide ? " modal-wide" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading">
          <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">X</button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function ChartPanel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={"panel chart-panel " + className}>
      <div className="panel-heading">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function formatDate(value, options = {}) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toLocalDateTime(value) {
  const date = value ? new Date(value) : new Date();
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export function todayInput() {
  const now = new Date();
  const adjusted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 10);
}
