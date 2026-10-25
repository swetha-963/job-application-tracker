import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { errorMessage, api } from "../api/client";
import { todayInput } from "./Ui";

const emptyApplication = {
  title: "",
  company_name: "",
  company_website: "",
  job_description: "",
  job_type: "full_time",
  work_mode: "on_site",
  sector: "it",
  industry: "",
  country: "India",
  city: "",
  location_category: "india",
  salary_min: "",
  salary_max: "",
  salary_currency: "INR",
  application_date: todayInput(),
  status: "saved",
  job_posting_url: "",
  source: "linkedin",
  recruiter_name: "",
  recruiter_contact: "",
  next_follow_up_date: "",
  personal_notes: "",
};

const selectOptions = {
  job_type: [
    ["full_time", "Full-time"], ["part_time", "Part-time"], ["internship", "Internship"],
    ["contract", "Contract"], ["remote", "Remote"],
  ],
  work_mode: [["on_site", "On-site"], ["hybrid", "Hybrid"], ["remote", "Remote"]],
  sector: [["it", "IT"], ["non_it", "Non-IT"]],
  location_category: [["india", "India"], ["gulf", "Gulf"]],
  salary_currency: [["INR", "INR"], ["BHD", "BHD"], ["AED", "AED"], ["SAR", "SAR"], ["QAR", "QAR"], ["OMR", "OMR"], ["KWD", "KWD"]],
  status: [["saved", "Saved"], ["applied", "Applied"], ["assessment", "Assessment"], ["interview", "Interview"], ["offer", "Offer"], ["rejected", "Rejected"], ["withdrawn", "Withdrawn"]],
  source: [["linkedin", "LinkedIn"], ["company_website", "Company website"], ["referral", "Referral"], ["job_portal", "Job portal"], ["recruiter", "Recruiter"], ["other", "Other"]],
};

function TextField({ label, name, value, onChange, type = "text", required = false, placeholder = "", ...props }) {
  return (
    <label className="field">
      <span>{label}{required && <i> *</i>}</span>
      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        {...props}
      />
    </label>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} value={value ?? ""} onChange={onChange}>
        {options.map(([key, optionLabel]) => <option key={key} value={key}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

export default function ApplicationForm({ initial, onCancel, onSaved }) {
  const [values, setValues] = useState(emptyApplication);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues({ ...emptyApplication, ...initial, application_date: initial?.application_date || todayInput() });
    setError("");
  }, [initial]);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      ...values,
      salary_min: values.salary_min === "" ? null : values.salary_min,
      salary_max: values.salary_max === "" ? null : values.salary_max,
      next_follow_up_date: values.next_follow_up_date || null,
    };
    try {
      if (initial?.id) await api.patch("/applications/" + initial.id + "/", payload);
      else await api.post("/applications/", payload);
      onSaved();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="application-form" onSubmit={handleSubmit}>
      {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}
      <div className="form-section-title"><span>Role details</span><small>Fields marked * are required</small></div>
      <div className="form-grid">
        <TextField label="Job title" name="title" value={values.title} onChange={handleChange} required placeholder="e.g. Python Developer" />
        <TextField label="Company" name="company_name" value={values.company_name} onChange={handleChange} required placeholder="Company name" />
        <TextField label="Company website" name="company_website" value={values.company_website} onChange={handleChange} type="url" placeholder="https://company.com" />
        <TextField label="Job posting URL" name="job_posting_url" value={values.job_posting_url} onChange={handleChange} type="url" placeholder="https://..." />
        <SelectField label="Job type" name="job_type" value={values.job_type} onChange={handleChange} options={selectOptions.job_type} />
        <SelectField label="Work mode" name="work_mode" value={values.work_mode} onChange={handleChange} options={selectOptions.work_mode} />
        <SelectField label="Sector" name="sector" value={values.sector} onChange={handleChange} options={selectOptions.sector} />
        <TextField label="Industry" name="industry" value={values.industry} onChange={handleChange} placeholder="e.g. Fintech" />
      </div>

      <div className="form-section-title"><span>Location and compensation</span></div>
      <div className="form-grid">
        <TextField label="Country" name="country" value={values.country} onChange={handleChange} placeholder="India, UAE..." />
        <TextField label="City" name="city" value={values.city} onChange={handleChange} placeholder="Bengaluru" />
        <SelectField label="Location region" name="location_category" value={values.location_category} onChange={handleChange} options={selectOptions.location_category} />
        <SelectField label="Salary currency" name="salary_currency" value={values.salary_currency} onChange={handleChange} options={selectOptions.salary_currency} />
        <TextField label="Salary minimum" name="salary_min" value={values.salary_min} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0" />
        <TextField label="Salary maximum" name="salary_max" value={values.salary_max} onChange={handleChange} type="number" min="0" step="0.01" placeholder="0" />
      </div>

      <div className="form-section-title"><span>Application tracking</span></div>
      <div className="form-grid">
        <TextField label="Application date" name="application_date" value={values.application_date} onChange={handleChange} type="date" required />
        <SelectField label="Status" name="status" value={values.status} onChange={handleChange} options={selectOptions.status} />
        <SelectField label="Source" name="source" value={values.source} onChange={handleChange} options={selectOptions.source} />
        <TextField label="Next follow-up" name="next_follow_up_date" value={values.next_follow_up_date} onChange={handleChange} type="date" />
        <TextField label="Recruiter name" name="recruiter_name" value={values.recruiter_name} onChange={handleChange} placeholder="Name (optional)" />
        <TextField label="Recruiter contact" name="recruiter_contact" value={values.recruiter_contact} onChange={handleChange} placeholder="Email or phone" />
      </div>

      <label className="field">
        <span>Job description</span>
        <textarea name="job_description" value={values.job_description} onChange={handleChange} rows="3" placeholder="Paste a short description or key requirements..." />
      </label>
      <label className="field">
        <span>Personal notes</span>
        <textarea name="personal_notes" value={values.personal_notes} onChange={handleChange} rows="3" placeholder="What should you remember about this role?" />
      </label>
      <div className="form-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>Cancel</button>
        <button type="submit" className="button button-primary" disabled={saving}>
          <Check size={16} /> {saving ? "Saving..." : initial?.id ? "Save changes" : "Save application"}
        </button>
      </div>
    </form>
  );
}
