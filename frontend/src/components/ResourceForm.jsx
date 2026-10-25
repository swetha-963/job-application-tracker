import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { api, errorMessage } from "../api/client";
import { toLocalDateTime } from "./Ui";

const defaults = {
  interview: {
    application: "",
    scheduled_at: "",
    interview_type: "online",
    round: "hr",
    meeting_link: "",
    location: "",
    interviewer_name: "",
    preparation_notes: "",
    status: "upcoming",
  },
  reminder: {
    application: "",
    title: "",
    description: "",
    due_at: "",
    reminder_type: "custom",
  },
  note: {
    application: "",
    title: "",
    content: "",
  },
};

const config = {
  interview: { path: "/interviews/", title: "interview" },
  reminder: { path: "/reminders/", title: "reminder" },
  note: { path: "/notes/", title: "note" },
};

export default function ResourceForm({ kind, initial, applications = [], onCancel, onSaved }) {
  const [values, setValues] = useState(defaults[kind]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const next = { ...defaults[kind], ...initial };
    if (kind === "interview" && next.scheduled_at) next.scheduled_at = toLocalDateTime(next.scheduled_at);
    if (kind === "reminder" && next.due_at) next.due_at = toLocalDateTime(next.due_at);
    setValues(next);
    setError("");
  }, [kind, initial]);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { ...values };
    if (!payload.application) payload.application = null;
    if (kind === "interview") payload.scheduled_at = new Date(values.scheduled_at).toISOString();
    if (kind === "reminder") payload.due_at = new Date(values.due_at).toISOString();
    try {
      if (initial?.id) await api.patch(config[kind].path + initial.id + "/", payload);
      else await api.post(config[kind].path, payload);
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError, "Could not save this " + config[kind].title + "."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="resource-form" onSubmit={submit}>
      {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}
      <label className="field">
        <span>Related application{kind === "interview" && <i> *</i>}</span>
        <select name="application" value={values.application || ""} onChange={update} required={kind === "interview"}>
          {kind !== "interview" && <option value="">General career item</option>}
          {applications.map((application) => <option value={application.id} key={application.id}>{application.title} - {application.company_name}</option>)}
        </select>
      </label>

      {kind === "interview" && <>
        <div className="form-grid">
          <label className="field"><span>Date and time *</span><input type="datetime-local" name="scheduled_at" value={values.scheduled_at} onChange={update} required /></label>
          <label className="field"><span>Interview type</span><select name="interview_type" value={values.interview_type} onChange={update}><option value="online">Online</option><option value="phone">Phone</option><option value="in_person">In-person</option></select></label>
          <label className="field"><span>Round</span><select name="round" value={values.round} onChange={update}><option value="hr">HR</option><option value="technical">Technical</option><option value="coding">Coding</option><option value="managerial">Managerial</option><option value="other">Other</option></select></label>
          <label className="field"><span>Interviewer</span><input name="interviewer_name" value={values.interviewer_name || ""} onChange={update} placeholder="Interviewer name" /></label>
          <label className="field"><span>Meeting link</span><input type="url" name="meeting_link" value={values.meeting_link || ""} onChange={update} placeholder="https://..." /></label>
          <label className="field"><span>Location</span><input name="location" value={values.location || ""} onChange={update} placeholder="Office or meeting room" /></label>
          <label className="field"><span>Status</span><select name="status" value={values.status} onChange={update}><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
        </div>
        <label className="field"><span>Preparation notes</span><textarea rows="4" name="preparation_notes" value={values.preparation_notes || ""} onChange={update} placeholder="Topics to prepare, questions to ask..." /></label>
      </>}

      {kind === "reminder" && <>
        <label className="field"><span>Reminder title *</span><input name="title" value={values.title} onChange={update} required placeholder="e.g. Follow up with recruiter" /></label>
        <div className="form-grid">
          <label className="field"><span>Date and time *</span><input type="datetime-local" name="due_at" value={values.due_at} onChange={update} required /></label>
          <label className="field"><span>Type</span><select name="reminder_type" value={values.reminder_type} onChange={update}><option value="interview">Interview</option><option value="recruiter_follow_up">Recruiter follow-up</option><option value="application_deadline">Application deadline</option><option value="assessment">Assessment</option><option value="custom">Custom</option></select></label>
        </div>
        <label className="field"><span>Description</span><textarea rows="3" name="description" value={values.description || ""} onChange={update} placeholder="Add a useful note..." /></label>
      </>}

      {kind === "note" && <>
        <label className="field"><span>Note title *</span><input name="title" value={values.title} onChange={update} required placeholder="e.g. Interview preparation" /></label>
        <label className="field"><span>Note *</span><textarea rows="7" name="content" value={values.content} onChange={update} required placeholder="Capture a recruiter conversation, useful research, or a career goal..." /></label>
      </>}

      <div className="form-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={saving}><Check size={16} />{saving ? "Saving..." : "Save " + config[kind].title}</button>
      </div>
    </form>
  );
}
