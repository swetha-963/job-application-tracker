import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, MapPin, Pencil, Phone, Plus, Trash2, Video } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage, getAll } from "../api/client";
import ResourceForm from "../components/ResourceForm";
import { EmptyState, Loading, Modal, PageHeader, StatusBadge, formatDateTime } from "../components/Ui";

function countdown(value) {
  const minutes = Math.max(0, Math.floor((new Date(value).getTime() - Date.now()) / 60000));
  const days = Math.floor(minutes / 1440);
  if (days > 0) return "In " + days + (days === 1 ? " day" : " days");
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return "In " + hours + (hours === 1 ? " hour" : " hours");
  return "In " + Math.max(1, minutes) + " min";
}

export default function InterviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([getAll("/interviews/"), getAll("/applications/")]);
      setInterviews(results[0]);
      setApplications(results[1]);
    } catch (error) {
      toast.error(errorMessage(error, "Could not load interviews."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (searchParams.get("create") === "1") {
      const application = searchParams.get("application");
      setEditing(application ? { application: Number(application) } : null);
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const upcoming = useMemo(
    () => interviews
      .filter((item) => item.status === "upcoming" && new Date(item.scheduled_at) >= new Date())
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)),
    [interviews],
  );
  const visible = filter === "all" ? interviews : interviews.filter((item) => item.status === filter);
  const nextInterview = upcoming[0];

  async function remove(item) {
    if (!window.confirm("Delete this interview for " + item.application_title + "?")) return;
    try {
      await api.delete("/interviews/" + item.id + "/");
      toast.success("Interview deleted.");
      setInterviews((current) => current.filter((row) => row.id !== item.id));
    } catch (error) { toast.error(errorMessage(error)); }
  }

  function saved() {
    setOpen(false);
    setEditing(null);
    toast.success(editing?.id ? "Interview updated." : "Interview scheduled.");
    load();
  }

  if (loading) return <Loading label="Loading interview schedule..." />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="BE READY FOR THE CONVERSATION" title="Interview schedule" description="A calm overview of what's coming up and what you've completed." action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={17} /> Schedule interview</button>} />
      {nextInterview && <section className="next-interview-banner"><div className="next-interview-icon"><CalendarDays size={22} /></div><div><span>NEXT UP</span><strong>{nextInterview.application_title} at {nextInterview.company_name}</strong><small>{nextInterview.round} round | {formatDateTime(nextInterview.scheduled_at)}</small></div><div className="interview-countdown"><Clock3 size={16} />{countdown(nextInterview.scheduled_at)}</div></section>}
      <div className="list-toolbar panel">
        <div className="segmented-control">{[["all", "All"], ["upcoming", "Upcoming"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([key, label]) => <button key={key} className={filter === key ? "selected" : ""} onClick={() => setFilter(key)}>{label}</button>)}</div>
        <span className="list-count">{visible.length} interview{visible.length === 1 ? "" : "s"}</span>
      </div>
      {visible.length === 0 ? <EmptyState icon={CalendarDays} title="No interviews here yet" description="Schedule an interview to connect it with a role and prepare with confidence." action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Schedule interview</button>} /> : (
        <div className="interview-list">
          {visible.map((item) => {
            const Icon = item.interview_type === "phone" ? Phone : item.interview_type === "online" ? Video : MapPin;
            return <article className="panel interview-row" key={item.id}>
              <div className="interview-date-tile"><span>{new Date(item.scheduled_at).toLocaleDateString("en-IN", { month: "short" })}</span><strong>{new Date(item.scheduled_at).getDate()}</strong><small>{new Date(item.scheduled_at).toLocaleDateString("en-IN", { weekday: "short" })}</small></div>
              <div className="interview-info"><div className="interview-title-line"><h2>{item.round} interview</h2><StatusBadge status={item.status} /></div><strong>{item.application_title} <span>at {item.company_name}</span></strong><div className="interview-meta"><span><Clock3 size={14} />{formatDateTime(item.scheduled_at)}</span><span><Icon size={14} />{item.interview_type.replaceAll("_", " ")}</span>{item.interviewer_name && <span>{item.interviewer_name}</span>}</div>{item.meeting_link && <a className="text-link" href={item.meeting_link} target="_blank" rel="noreferrer">Open meeting link <MapPin size={13} /></a>}{item.location && <p className="interview-location">{item.location}</p>}</div>
              <div className="row-actions"><button className="icon-button" onClick={() => { setEditing(item); setOpen(true); }} aria-label="Edit interview"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(item)} aria-label="Delete interview"><Trash2 size={15} /></button></div>
            </article>;
          })}
        </div>
      )}
      {open && <Modal title={editing?.id ? "Edit interview" : "Schedule an interview"} description="Connect it to an application so the details stay together." onClose={() => { setOpen(false); setEditing(null); }}><ResourceForm kind="interview" initial={editing} applications={applications} onCancel={() => { setOpen(false); setEditing(null); }} onSaved={saved} /></Modal>}
    </div>
  );
}
