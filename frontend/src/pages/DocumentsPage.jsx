import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, Download, FileText, Pencil, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { api, errorMessage, getAll } from "../api/client";
import { EmptyState, Loading, Modal, PageHeader, formatDate } from "../components/Ui";

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "resume.pdf";
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({ title: "", description: "", application: "", is_default: false, file: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await Promise.all([getAll("/documents/"), getAll("/applications/")]);
      setDocuments(response[0]);
      setApplications(response[1]);
    } catch (requestError) {
      setLoadError(errorMessage(requestError, "Could not load your CV library."));
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function beginEdit(item = null) {
    setEditing(item);
    setValues({
      title: item?.title || "",
      description: item?.description || "",
      application: item?.application || "",
      is_default: Boolean(item?.is_default),
      file: null,
    });
    setError("");
    setOpen(true);
  }

  function update(event) {
    const { name, value, type, checked, files } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] || null : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("is_default", String(values.is_default));
    if (values.application) formData.append("application", values.application);
    if (values.file) formData.append("file", values.file);
    try {
      if (editing?.id) await api.patch("/documents/" + editing.id + "/", formData);
      else await api.post("/documents/", formData);
      setOpen(false);
      toast.success(editing?.id ? "CV updated." : "CV uploaded.");
      load();
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not save this document."));
    } finally { setSaving(false); }
  }

  async function download(item) {
    try {
      const response = await api.get("/documents/" + item.id + "/download/", { responseType: "blob" });
      saveBlob(response.data, item.file_name);
    } catch (requestError) { toast.error(errorMessage(requestError, "Could not download this file.")); }
  }

  async function makeDefault(item) {
    try {
      await api.patch("/documents/" + item.id + "/", { is_default: true });
      toast.success("Default CV updated.");
      load();
    } catch (requestError) { toast.error(errorMessage(requestError, "Could not update the default CV.")); }
  }

  async function remove(item) {
    if (!window.confirm("Delete \"" + item.title + "\" and its uploaded file?")) return;
    try {
      await api.delete("/documents/" + item.id + "/");
      setDocuments((current) => current.filter((row) => row.id !== item.id));
      toast.success("Document deleted.");
    } catch (requestError) { toast.error(errorMessage(requestError, "Could not delete the document.")); }
  }

  if (loading) return <Loading label="Loading your CV library..." />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="YOUR CAREER DOCUMENTS" title="CV library" description="Keep private resume copies ready for the roles you want." action={<button className="button button-primary" onClick={() => beginEdit()}><Upload size={16} /> Upload a PDF</button>} />
      <div className="document-privacy"><ShieldCheck size={17} /><span>Files are private. Downloads require your authenticated account and PDF uploads are limited to 5 MB.</span></div>
      {loadError ? <EmptyState icon={AlertCircle} title="Could not load your CV library" description={loadError} action={<button className="button button-primary" onClick={load}>Try again</button>} /> : !documents.length ? <EmptyState icon={FileText} title="Your CV library is empty" description="Upload a PDF resume and keep the version you want to use close by." action={<button className="button button-primary" onClick={() => beginEdit()}><Upload size={16} /> Upload a CV</button>} /> : (
        <div className="documents-grid">{documents.map((item) => <article className={"panel document-card" + (item.is_default ? " document-default" : "")} key={item.id}>
          <div className="document-card-top"><div className="pdf-mark"><FileText size={22} /><span>PDF</span></div>{item.is_default && <span className="default-pill"><Check size={13} /> Default</span>}</div>
          <h2>{item.title}</h2><p>{item.file_name}</p>{item.description && <div className="document-description">{item.description}</div>}
          <div className="document-card-meta"><span>{item.application_title || "General resume"}</span><span>Uploaded {formatDate(item.created_at)}</span></div>
          <div className="document-card-actions"><button className="button button-soft" onClick={() => download(item)}><Download size={15} /> Download</button>{!item.is_default && <button className="button button-quiet" onClick={() => makeDefault(item)}>Make default</button>}<div className="row-actions"><button className="icon-button" onClick={() => beginEdit(item)} aria-label="Edit document"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(item)} aria-label="Delete document"><Trash2 size={15} /></button></div></div>
        </article>)}</div>
      )}
      {open && <Modal title={editing?.id ? "Update CV" : "Upload a CV"} description="PDF only, up to 5 MB. Your file stays private to your account." onClose={() => setOpen(false)}>
        <form className="resource-form" onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}
          <label className="field"><span>Document title *</span><input name="title" required value={values.title} onChange={update} placeholder="e.g. Backend developer resume" /></label>
          <label className="field"><span>Associate with an application</span><select name="application" value={values.application || ""} onChange={update}><option value="">General resume</option>{applications.map((application) => <option key={application.id} value={application.id}>{application.title} - {application.company_name}</option>)}</select></label>
          <label className="field"><span>Description</span><textarea rows="3" name="description" value={values.description} onChange={update} placeholder="A short note about this version..." /></label>
          <label className="file-picker"><Upload size={19} /><span>{values.file?.name || (editing?.file_name ? "Current file: " + editing.file_name : "Choose a PDF file")}</span><input name="file" type="file" accept="application/pdf,.pdf" onChange={update} required={!editing} /></label>
          <label className="checkbox-field"><input type="checkbox" name="is_default" checked={values.is_default} onChange={update} /><span>Make this my default resume</span></label>
          <div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" disabled={saving}><Check size={16} />{saving ? "Saving..." : editing ? "Save changes" : "Upload CV"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}


