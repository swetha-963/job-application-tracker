import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, FileText, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, downloadPrivateFile, errorMessage, getList } from "../api/client";
import { EmptyState, Loading, PageHeader, StatusBadge, formatDate, formatDateTime } from "../components/Ui";

function formatSalary(application) {
  if (application.salary_min == null && application.salary_max == null) {
    return "Not provided";
  }
  const currency = application.salary_currency ? application.salary_currency + " " : "";
  const minimum = application.salary_min ?? "Unspecified";
  const maximum = application.salary_max ?? "Unspecified";
  return currency + minimum + " - " + maximum;
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [related, setRelated] = useState({ interviews: [], reminders: [], notes: [], documents: [], activity: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/applications/" + id + "/"),
      api.get("/interviews/", { params: { application: id } }),
      api.get("/reminders/", { params: { application: id } }),
      api.get("/notes/", { params: { application: id } }),
      api.get("/documents/", { params: { application: id } }),
      api.get("/applications/" + id + "/timeline/"),
    ]).then((responses) => {
      if (!active) return;
      setApplication(responses[0].data);
      setRelated({
        interviews: getList(responses[1].data),
        reminders: getList(responses[2].data),
        notes: getList(responses[3].data),
        documents: getList(responses[4].data),
        activity: responses[5].data,
      });
    }).catch((requestError) => {
      if (active) setError(errorMessage(requestError, "Could not load this application."));
    });
    return () => { active = false; };
  }, [id]);

  async function deleteApplication() {
    if (!window.confirm("Delete this application and its linked records? This action cannot be undone.")) return;
    try {
      await api.delete("/applications/" + id + "/");
      toast.success("Application deleted.");
      navigate("/applications");
    } catch (requestError) {
      toast.error(errorMessage(requestError, "Could not delete application."));
    }
  }

  if (error) return <div className="panel inline-error">{error} <Link to="/applications">Back to applications</Link></div>;
  if (!application) return <Loading label="Loading application details..." />;

  return (
    <div className="page-stack">
      <Link className="back-link" to="/applications"><ArrowLeft size={15} /> All applications</Link>
      <PageHeader
        eyebrow={application.company_name}
        title={application.title}
        description={[application.city, application.country].filter(Boolean).join(", ") || "Location not set"}
        action={<div className="header-actions"><Link className="button button-quiet" to={"/applications/" + id + "/edit"}><Pencil size={15} /> Edit</Link><button className="button button-danger" onClick={deleteApplication}><Trash2 size={15} /> Delete</button></div>}
      />
      <div className="detail-summary panel">
        <div className="detail-company-mark">{(application.company_name || "C").slice(0, 1).toUpperCase()}</div>
        <div className="detail-summary-copy"><StatusBadge status={application.status} /><p>{application.industry || application.sector?.toUpperCase() || "Role details"}</p></div>
        <div className="detail-summary-facts">
          <div><span>Applied</span><strong>{formatDate(application.application_date)}</strong></div>
          <div><span>Job type</span><strong>{application.job_type?.replaceAll("_", " ") || "Not set"}</strong></div>
          <div><span>Work mode</span><strong>{application.work_mode?.replaceAll("_", " ") || "Not set"}</strong></div>
          <div><span>Salary range</span><strong>{formatSalary(application)}</strong></div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-main-column">
          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>Role overview</h2><p>The information you saved about this opportunity.</p></div></div>
            <dl className="detail-definition-grid">
              <div><dt>Company website</dt><dd>{application.company_website ? <a href={application.company_website} target="_blank" rel="noreferrer">{application.company_website}<ExternalLink size={13} /></a> : "Not provided"}</dd></div>
              <div><dt>Job posting</dt><dd>{application.job_posting_url ? <a href={application.job_posting_url} target="_blank" rel="noreferrer">Open job posting <ExternalLink size={13} /></a> : "Not provided"}</dd></div>
              <div><dt>Source</dt><dd>{application.source?.replaceAll("_", " ") || "Not set"}</dd></div>
              <div><dt>Next follow-up</dt><dd>{formatDate(application.next_follow_up_date)}</dd></div>
              <div><dt>Recruiter</dt><dd>{application.recruiter_name || "Not provided"}</dd></div>
              <div><dt>Recruiter contact</dt><dd>{application.recruiter_contact || "Not provided"}</dd></div>
              <div><dt>Region</dt><dd>{application.location_category === "gulf" ? "Gulf" : application.location_category === "india" ? "India" : "Not set"}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDate(application.updated_at)}</dd></div>
            </dl>
            {application.job_description && <div className="detail-text-block"><h3>Job description</h3><p>{application.job_description}</p></div>}
            {application.personal_notes && <div className="detail-text-block"><h3>Personal notes</h3><p>{application.personal_notes}</p></div>}
          </section>

          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>Activity timeline</h2><p>Recent changes to this application.</p></div></div>
            {related.activity.length ? <div className="timeline-list">{related.activity.map((event) => <div className="timeline-item" key={event.id}><span className="timeline-dot" /><div><strong>{event.description}</strong><small>{formatDateTime(event.created_at)}</small></div></div>)}</div> : <EmptyState title="No activity recorded yet" description="Changes to this application will show here." />}
          </section>
        </div>

        <aside className="detail-side-column">
          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>Interviews</h2><p>Connected to this role</p></div><Link className="icon-button" to={"/interviews?application=" + id + "&create=1"} aria-label="Add interview"><Plus size={17} /></Link></div>
            {related.interviews.length ? <div className="compact-list">{related.interviews.map((item) => <div className="compact-row" key={item.id}><div className="compact-icon"><CalendarDays size={16} /></div><div><strong>{item.round} round</strong><span>{formatDateTime(item.scheduled_at)}</span><small>{item.interview_type.replaceAll("_", " ")} | {item.status}</small></div></div>)}</div> : <p className="muted-small">No interviews linked yet.</p>}
          </section>
          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>Follow-ups</h2><p>Related reminders</p></div><Link className="icon-button" to={"/reminders?application=" + id + "&create=1"} aria-label="Add reminder"><Plus size={17} /></Link></div>
            {related.reminders.length ? <div className="compact-list">{related.reminders.map((item) => <div className="compact-row" key={item.id}><div className="compact-icon reminder-icon"><Clock3 size={16} /></div><div><strong>{item.title}</strong><span>{formatDateTime(item.due_at)}</span><small>{item.is_completed ? "Completed" : "Open"}</small></div></div>)}</div> : <p className="muted-small">No reminders linked yet.</p>}
          </section>
          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>Notes</h2><p>Preparation and conversation notes</p></div><Link className="icon-button" to={"/notes?application=" + id + "&create=1"} aria-label="Add note"><Plus size={17} /></Link></div>
            {related.notes.length ? related.notes.map((item) => <article className="note-preview" key={item.id}><strong>{item.title}</strong><p>{item.content}</p><small>{formatDate(item.updated_at)}</small></article>) : <p className="muted-small">No notes linked yet.</p>}
          </section>
          <section className="panel detail-panel">
            <div className="panel-heading"><div><h2>CV used</h2><p>Documents linked to this role</p></div><FileText size={17} /></div>
            {related.documents.length ? related.documents.map((item) => <button className="document-mini" key={item.id} onClick={() => downloadPrivateFile("/documents/" + item.id + "/download/", item.file_name)}><FileText size={16} /><span>{item.title}</span></button>) : <p className="muted-small">No resume linked yet.</p>}
          </section>
          <div className="detail-nudge"><MapPin size={16} /><span>Following up on time is one of the easiest ways to stay visible.</span></div>
        </aside>
      </div>
    </div>
  );
}
