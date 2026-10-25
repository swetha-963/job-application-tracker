import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpRight, Briefcase, Download, Filter, LayoutGrid, List, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage } from "../api/client";
import ApplicationForm from "../components/ApplicationForm";
import { EmptyState, Loading, Modal, PageHeader, StatusBadge, formatDate } from "../components/Ui";

const statusOptions = [
  ["", "All statuses"], ["saved", "Saved"], ["applied", "Applied"], ["assessment", "Assessment"],
  ["interview", "Interview"], ["offer", "Offer"], ["rejected", "Rejected"], ["withdrawn", "Withdrawn"],
];

function ApplicationCard({ item, onDelete }) {
  return (
    <article className="application-card">
      <div className="application-card-head">
        <div className="company-avatar company-avatar-large">{(item.company_name || "C").slice(0, 1).toUpperCase()}</div>
        <StatusBadge status={item.status} />
      </div>
      <Link className="application-card-title" to={"/applications/" + item.id}>{item.title}</Link>
      <p className="application-company">{item.company_name}</p>
      <div className="application-card-meta">
        <span><MapPin size={14} />{[item.city, item.country].filter(Boolean).join(", ") || "Location not set"}</span>
        <span>{item.job_type?.replaceAll("_", " ") || "Job type not set"}</span>
      </div>
      <div className="application-card-footer">
        <span>Applied {formatDate(item.application_date)}</span>
        <div className="row-actions">
          <Link className="icon-button" to={"/applications/" + item.id + "/edit"} aria-label="Edit application"><Pencil size={15} /></Link>
          <button className="icon-button danger-icon" onClick={() => onDelete(item)} aria-label="Delete application"><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  );
}

export default function ApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState("");
  const [country, setCountry] = useState("");
  const [locationCategory, setLocationCategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [view, setView] = useState("cards");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true);
      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.delete("create");
        return nextParams;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, status, country, locationCategory, jobType]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      api.get("/applications/", {
        params: {
          page,
          search: search || undefined,
          status: status || undefined,
          country: country || undefined,
          location_category: locationCategory || undefined,
          job_type: jobType || undefined,
          ordering: "-application_date",
        },
      }).then((response) => {
        if (!active) return;
        setRows(response.data.results || []);
        setNext(response.data.next);
        setPrevious(response.data.previous);
      }).catch((error) => {
        if (active) toast.error(errorMessage(error, "Could not load applications."));
      }).finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [page, search, status, country, locationCategory, jobType]);

  const hasFilters = useMemo(() => Boolean(search || status || country || locationCategory || jobType), [search, status, country, locationCategory, jobType]);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCountry("");
    setLocationCategory("");
    setJobType("");
    setPage(1);
  }

  async function removeApplication(item) {
    if (!window.confirm("Delete " + item.title + " at " + item.company_name + "? Related interviews and reminders will also be deleted.")) return;
    try {
      await api.delete("/applications/" + item.id + "/");
      toast.success("Application deleted.");
      setRows((current) => current.filter((row) => row.id !== item.id));
    } catch (error) {
      toast.error(errorMessage(error, "Could not delete application."));
    }
  }

  async function exportCsv() {
    try {
      const response = await api.get("/applications/export/", {
        params: { search: search || undefined, status: status || undefined, country: country || undefined },
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "careerflow-applications.csv";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Your CSV export is ready.");
    } catch (error) {
      toast.error(errorMessage(error, "Could not export applications."));
    }
  }

  async function saved() {
    setCreateOpen(false);
    toast.success("Application added.");
    setPage(1);
    try {
      const response = await api.get("/applications/", { params: { page: 1, search: search || undefined } });
      setRows(response.data.results || []);
      setNext(response.data.next);
      setPrevious(response.data.previous);
    } catch {
      setPage(1);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR OPPORTUNITIES"
        title="Applications"
        description="Keep every role, recruiter, and next step in one place."
        action={<div className="header-actions">
          <button className="button button-quiet" onClick={exportCsv}><Download size={16} /> Export CSV</button>
          <button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={17} /> Add application</button>
        </div>}
      />

      <section className="panel application-toolbar">
        <div className="filter-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, company, or location" aria-label="Search applications" /></div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">{statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <input className="filter-country" value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country" aria-label="Filter by country" />
        <select value={locationCategory} onChange={(event) => setLocationCategory(event.target.value)} aria-label="Filter by region"><option value="">India & Gulf</option><option value="india">India</option><option value="gulf">Gulf</option></select>
        <select value={jobType} onChange={(event) => setJobType(event.target.value)} aria-label="Filter by job type"><option value="">All job types</option><option value="full_time">Full-time</option><option value="part_time">Part-time</option><option value="internship">Internship</option><option value="contract">Contract</option><option value="remote">Remote</option></select>
        {hasFilters && <button className="clear-filter" onClick={clearFilters}><Filter size={14} /> Clear</button>}
        <div className="view-toggle" aria-label="Choose list view">
          <button className={view === "cards" ? "selected" : ""} onClick={() => setView("cards")} aria-label="Card view"><LayoutGrid size={17} /></button>
          <button className={view === "table" ? "selected" : ""} onClick={() => setView("table")} aria-label="Table view"><List size={17} /></button>
        </div>
      </section>

      <div className="list-summary"><span><strong>{rows.length}</strong> shown on this page</span><span><ArrowDownWideNarrow size={14} /> Recently applied first</span></div>

      {loading ? <Loading label="Loading applications..." /> : rows.length === 0 ? (
        <EmptyState icon={Briefcase} title={hasFilters ? "No matching applications" : "Your pipeline starts here"} description={hasFilters ? "Try clearing a filter or adjusting your search." : "Add your first role and start building a clear picture of your search."} action={hasFilters ? <button className="button button-soft" onClick={clearFilters}>Clear filters</button> : <button className="button button-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Add an application</button>} />
      ) : view === "cards" ? (
        <div className="application-grid">{rows.map((item) => <ApplicationCard key={item.id} item={item} onDelete={removeApplication} />)}</div>
      ) : (
        <section className="panel table-panel"><div className="table-scroll"><table className="data-table">
          <thead><tr><th>Role / company</th><th>Location</th><th>Applied</th><th>Status</th><th>Next follow-up</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{rows.map((item) => <tr key={item.id}>
            <td><Link className="table-role" to={"/applications/" + item.id}>{item.title}</Link><span className="table-company">{item.company_name}</span></td>
            <td>{[item.city, item.country].filter(Boolean).join(", ") || "Location not set"}</td>
            <td>{formatDate(item.application_date)}</td>
            <td><StatusBadge status={item.status} /></td>
            <td>{formatDate(item.next_follow_up_date)}</td>
            <td><div className="row-actions"><Link className="icon-button" to={"/applications/" + item.id + "/edit"} aria-label="Edit"><Pencil size={15} /></Link><button className="icon-button danger-icon" onClick={() => removeApplication(item)} aria-label="Delete"><Trash2 size={15} /></button><Link className="icon-button" to={"/applications/" + item.id} aria-label="View details"><ArrowUpRight size={15} /></Link></div></td>
          </tr>)}</tbody>
        </table></div></section>
      )}

      {(next || previous) && <div className="pagination-row">
        <button className="button button-quiet" disabled={!previous} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
        <span>Page {page}</span>
        <button className="button button-quiet" disabled={!next} onClick={() => setPage((current) => current + 1)}>Next</button>
      </div>}

      {createOpen && <Modal title="Add an application" description="Capture the essentials now. You can fill in more details later." onClose={() => setCreateOpen(false)} wide><ApplicationForm onCancel={() => setCreateOpen(false)} onSaved={saved} /></Modal>}
    </div>
  );
}
