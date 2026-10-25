import { useCallback, useEffect, useState } from "react";
import { Bell, CalendarClock, Check, Circle, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage, getAll } from "../api/client";
import ResourceForm from "../components/ResourceForm";
import { EmptyState, Loading, Modal, PageHeader, StatusBadge, formatDateTime } from "../components/Ui";

function isToday(value) {
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export default function RemindersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reminders, setReminders] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("open");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all([getAll("/reminders/"), getAll("/applications/")]);
      setReminders(results[0]);
      setApplications(results[1]);
    } catch (error) { toast.error(errorMessage(error, "Could not load reminders.")); }
    finally { setLoading(false); }
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

  const openItems = reminders.filter((item) => !item.is_completed);
  const overdue = openItems.filter((item) => new Date(item.due_at) < new Date() && !isToday(item.due_at));
  const dueToday = openItems.filter((item) => isToday(item.due_at));
  const upcoming = openItems.filter((item) => new Date(item.due_at) >= new Date() && !isToday(item.due_at));
  const sections = filter === "open"
    ? [["OVERDUE", overdue], ["DUE TODAY", dueToday], ["UPCOMING", upcoming]]
    : [["COMPLETED", reminders.filter((item) => item.is_completed)]];

  async function toggle(item) {
    try {
      const response = await api.patch("/reminders/" + item.id + "/", { is_completed: !item.is_completed });
      setReminders((current) => current.map((row) => row.id === item.id ? response.data : row));
      toast.success(response.data.is_completed ? "Reminder completed." : "Reminder reopened.");
    } catch (error) { toast.error(errorMessage(error)); }
  }

  async function remove(item) {
    if (!window.confirm("Delete the reminder \"" + item.title + "\"?")) return;
    try {
      await api.delete("/reminders/" + item.id + "/");
      setReminders((current) => current.filter((row) => row.id !== item.id));
      toast.success("Reminder deleted.");
    } catch (error) { toast.error(errorMessage(error)); }
  }

  function saved() {
    setOpen(false);
    setEditing(null);
    toast.success(editing?.id ? "Reminder updated." : "Reminder created.");
    load();
  }

  if (loading) return <Loading label="Loading reminders..." />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="THE LITTLE THINGS THAT KEEP YOU MOVING" title="Reminders" description="Keep follow-ups, deadlines, and preparation from slipping by." action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={17} /> Add reminder</button>} />
      <div className="reminder-summary-grid">
        <div className="panel reminder-summary"><div className="summary-icon overdue-icon"><Clock3 size={18} /></div><span>Overdue</span><strong>{overdue.length}</strong><small>Worth a quick review</small></div>
        <div className="panel reminder-summary"><div className="summary-icon today-icon"><CalendarClock size={18} /></div><span>Due today</span><strong>{dueToday.length}</strong><small>Your next small steps</small></div>
        <div className="panel reminder-summary"><div className="summary-icon upcoming-icon"><Bell size={18} /></div><span>Still ahead</span><strong>{upcoming.length}</strong><small>Upcoming reminders</small></div>
      </div>
      <div className="list-toolbar panel">
        <div className="segmented-control"><button className={filter === "open" ? "selected" : ""} onClick={() => setFilter("open")}>Open reminders</button><button className={filter === "completed" ? "selected" : ""} onClick={() => setFilter("completed")}>Completed</button></div>
        <span className="list-count">{reminders.length} total</span>
      </div>
      {sections.every(([, items]) => items.length === 0) ? <EmptyState icon={Bell} title={filter === "open" ? "No open reminders" : "Nothing completed yet"} description="Add a follow-up, interview preparation task, or application deadline." action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Add reminder</button>} /> : (
        <div className="reminder-sections">{sections.filter(([, items]) => items.length).map(([title, items]) => <section key={title}><div className="section-label"><span>{title}</span><i>{items.length}</i></div><div className="reminder-list">{items.map((item) => <article className={"panel reminder-row" + (item.is_completed ? " completed" : "")} key={item.id}>
          <button className={"reminder-check" + (item.is_completed ? " checked" : "")} onClick={() => toggle(item)} aria-label={item.is_completed ? "Reopen reminder" : "Mark reminder complete"}>{item.is_completed ? <Check size={16} /> : <Circle size={16} />}</button>
          <div className="reminder-copy"><div className="reminder-title-row"><strong>{item.title}</strong><StatusBadge status={item.is_completed ? "completed" : isToday(item.due_at) ? "due_today" : new Date(item.due_at) < new Date() ? "overdue" : "upcoming"} /></div><p>{item.description || item.application_title || item.reminder_type.replaceAll("_", " ")}</p><div className="reminder-meta"><span><Clock3 size={13} />{formatDateTime(item.due_at)}</span>{item.application_title && <span>{item.application_title} | {item.company_name}</span>}</div></div>
          <div className="row-actions"><button className="icon-button" onClick={() => { setEditing(item); setOpen(true); }} aria-label="Edit reminder"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(item)} aria-label="Delete reminder"><Trash2 size={15} /></button></div>
        </article>)}</div></section>)}</div>
      )}
      {open && <Modal title={editing?.id ? "Edit reminder" : "Add a reminder"} description="Put a useful next step on your calendar." onClose={() => { setOpen(false); setEditing(null); }}><ResourceForm kind="reminder" initial={editing} applications={applications} onCancel={() => { setOpen(false); setEditing(null); }} onSaved={saved} /></Modal>}
    </div>
  );
}
