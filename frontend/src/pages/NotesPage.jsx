import { useCallback, useEffect, useState } from "react";
import { FileText, Pencil, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage, getAll } from "../api/client";
import ResourceForm from "../components/ResourceForm";
import { EmptyState, Loading, Modal, PageHeader, formatDate } from "../components/Ui";

export default function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const results = await Promise.all([
        getAll("/notes/", query ? { search: query } : {}),
        getAll("/applications/"),
      ]);
      setNotes(results[0]);
      setApplications(results[1]);
    } catch (error) { toast.error(errorMessage(error, "Could not load your notes.")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(search), 160);
    return () => window.clearTimeout(timer);
  }, [load, search]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      const application = searchParams.get("application");
      setEditing(application ? { application: Number(application) } : null);
      setOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function remove(item) {
    if (!window.confirm("Delete the note \"" + item.title + "\"?")) return;
    try {
      await api.delete("/notes/" + item.id + "/");
      setNotes((current) => current.filter((row) => row.id !== item.id));
      toast.success("Note deleted.");
    } catch (error) { toast.error(errorMessage(error)); }
  }

  function saved() {
    setOpen(false);
    setEditing(null);
    toast.success(editing?.id ? "Note updated." : "Note saved.");
    load(search);
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="YOUR CAREER JOURNAL" title="Notes" description="Keep interview prep, recruiter conversations, and useful research close at hand." action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={17} /> New note</button>} />
      <section className="panel notes-toolbar"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search note titles, companies, or keywords..." aria-label="Search notes" /><span><FileText size={14} /> Private to your account</span></section>
      {loading ? <Loading label="Gathering your notes..." /> : notes.length === 0 ? <EmptyState icon={StickyNote} title={search ? "No notes matched" : "A place for useful details"} description={search ? "Try a different keyword or clear the search." : "Capture a recruiter conversation, interview prep, or a career goal."} action={<button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} /> Create a note</button>} /> : (
        <div className="notes-grid">{notes.map((item) => <article className="panel note-card" key={item.id}>
          <div className="note-card-top"><div className="note-icon"><StickyNote size={17} /></div><div className="row-actions"><button className="icon-button" onClick={() => { setEditing(item); setOpen(true); }} aria-label="Edit note"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(item)} aria-label="Delete note"><Trash2 size={15} /></button></div></div>
          <h2>{item.title}</h2><p className="note-content">{item.content}</p><div className="note-card-footer"><span>{item.application_title ? item.application_title + " | " + item.company_name : "General career note"}</span><span>{formatDate(item.updated_at)}</span></div>
        </article>)}</div>
      )}
      {open && <Modal title={editing?.id ? "Edit note" : "Write a note"} description="Save a detail you will be glad to have later." onClose={() => { setOpen(false); setEditing(null); }}><ResourceForm kind="note" initial={editing} applications={applications} onCancel={() => { setOpen(false); setEditing(null); }} onSaved={saved} /></Modal>}
    </div>
  );
}
