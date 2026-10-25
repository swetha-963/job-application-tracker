import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Briefcase, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage, getAll } from "../api/client";
import { EmptyState, Loading, PageHeader, StatusBadge } from "../components/Ui";

const stages = [
  ["saved", "Saved"], ["applied", "Applied"], ["assessment", "Assessment"],
  ["interview", "Interview"], ["offer", "Offer"], ["rejected", "Rejected"], ["withdrawn", "Withdrawn"],
];

export default function BoardPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await getAll("/applications/"));
    } catch (error) {
      toast.error(errorMessage(error, "Could not load your pipeline."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeStatus(application, status) {
    const previousStatus = application.status;
    setApplications((items) => items.map((item) => item.id === application.id ? { ...item, status } : item));
    try {
      await api.patch("/applications/" + application.id + "/", { status });
    } catch (error) {
      setApplications((items) => items.map((item) => item.id === application.id ? { ...item, status: previousStatus } : item));
      toast.error(errorMessage(error, "Could not move application."));
    }
  }

  function dropOn(event, status) {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/plain"));
    const application = applications.find((item) => item.id === id);
    if (application && application.status !== status) changeStatus(application, status);
    setDragging(null);
  }

  if (loading) return <Loading label="Building your pipeline..." />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="PIPELINE VIEW" title="Your opportunity board" description="Move a role forward as your search progresses." action={<Link className="button button-primary" to="/applications?create=1"><Plus size={17} /> Add application</Link>} />
      {!applications.length ? <EmptyState icon={Briefcase} title="Your board is waiting" description="Add a role, then move it through each stage as your search progresses." action={<Link className="button button-primary" to="/applications?create=1"><Plus size={16} /> Add an application</Link>} /> : (
        <div className="kanban-scroll">
          <div className="kanban-board">
            {stages.map(([key, label]) => {
              const items = applications.filter((application) => application.status === key);
              return (
                <section className={"kanban-column" + (dragging ? " drop-ready" : "")} key={key} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOn(event, key)}>
                  <header><div><span className={"stage-dot stage-" + key} /><h2>{label}</h2></div><span className="kanban-count">{items.length}</span></header>
                  <div className="kanban-cards">
                    {items.map((application) => (
                      <article className={"kanban-card" + (dragging === application.id ? " is-dragging" : "")} key={application.id} draggable onDragStart={(event) => { setDragging(application.id); event.dataTransfer.setData("text/plain", String(application.id)); }} onDragEnd={() => setDragging(null)}>
                        <div className="kanban-card-top"><span>{application.company_name}</span><StatusBadge status={application.status} /></div>
                        <Link to={"/applications/" + application.id} className="kanban-card-title">{application.title}</Link>
                        <span className="kanban-card-date">{application.city || application.country || "Location not set"}</span>
                        <label className="kanban-move"><span>Move to</span><select value={application.status} onChange={(event) => changeStatus(application, event.target.value)} aria-label={"Move " + application.title}><option value="saved">Saved</option><option value="applied">Applied</option><option value="assessment">Assessment</option><option value="interview">Interview</option><option value="offer">Offer</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option></select><ArrowRight size={13} /></label>
                      </article>
                    ))}
                    {!items.length && <div className="kanban-empty">Drop an application here</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
