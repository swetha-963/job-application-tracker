import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage } from "../api/client";
import ApplicationForm from "../components/ApplicationForm";
import { Loading, PageHeader } from "../components/Ui";

export default function EditApplicationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/applications/" + id + "/")
      .then((response) => setApplication(response.data))
      .catch((requestError) => setError(errorMessage(requestError, "Application not found.")));
  }, [id]);

  if (error) return <div className="panel inline-error">{error} <Link to="/applications">Back to applications</Link></div>;
  if (!application) return <Loading label="Loading application..." />;

  return (
    <div className="page-stack form-page">
      <Link className="back-link" to={"/applications/" + id}><ArrowLeft size={15} /> Back to application</Link>
      <PageHeader eyebrow="EDIT ROLE" title="Update application" description="Keep your record current as the process moves forward." />
      <section className="panel form-panel">
        <ApplicationForm initial={application} onCancel={() => navigate("/applications/" + id)} onSaved={() => { toast.success("Application updated."); navigate("/applications/" + id); }} />
      </section>
    </div>
  );
}
