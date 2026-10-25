import { useEffect, useState } from "react";
import { Check, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { api, errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/Ui";

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "" });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setProfile({ first_name: user?.first_name || "", last_name: user?.last_name || "", email: user?.email || "" });
  }, [user]);

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    try {
      await updateProfile(profile);
      toast.success("Profile updated.");
    } catch (error) {
      setProfileError(errorMessage(error, "Could not update your profile."));
    } finally { setSavingProfile(false); }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    if (passwords.new_password !== passwords.confirm_password) {
      setPasswordError("Your new passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.post("/auth/change-password/", {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      toast.success("Password changed. Sign in again with your new password.");
      try { await logout(); } catch {}
      navigate("/login", { replace: true });
    } catch (error) {
      setPasswordError(errorMessage(error, "Could not change your password."));
    } finally { setSavingPassword(false); }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="YOUR ACCOUNT" title="Profile & settings" description="Manage the details and security of your private workspace." />
      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="settings-heading"><div className="settings-icon"><UserRound size={19} /></div><div><h2>Profile details</h2><p>How your account is identified in CareerFlow.</p></div></div>
          <form className="resource-form" onSubmit={saveProfile}>
            {profileError && <div className="form-error">{profileError}</div>}
            <label className="field"><span>Username</span><input value={user?.username || ""} disabled /></label>
            <div className="form-grid">
              <label className="field"><span>First name</span><input value={profile.first_name} onChange={(event) => setProfile((current) => ({ ...current, first_name: event.target.value }))} /></label>
              <label className="field"><span>Last name</span><input value={profile.last_name} onChange={(event) => setProfile((current) => ({ ...current, last_name: event.target.value }))} /></label>
            </div>
            <label className="field"><span>Email address</span><input type="email" required value={profile.email} onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))} /></label>
            <div className="form-actions"><span className="settings-private-note"><ShieldCheck size={15} /> Your profile is private.</span><button className="button button-primary" disabled={savingProfile}><Save size={16} />{savingProfile ? "Saving..." : "Save profile"}</button></div>
          </form>
        </section>

        <section className="panel settings-panel">
          <div className="settings-heading"><div className="settings-icon security-settings-icon"><KeyRound size={19} /></div><div><h2>Change password</h2><p>Use a strong password that you do not reuse elsewhere.</p></div></div>
          <form className="resource-form" onSubmit={changePassword}>
            {passwordError && <div className="form-error">{passwordError}</div>}
            <label className="field"><span>Current password</span><input type="password" required autoComplete="current-password" value={passwords.current_password} onChange={(event) => setPasswords((current) => ({ ...current, current_password: event.target.value }))} /></label>
            <label className="field"><span>New password</span><input type="password" required minLength={8} autoComplete="new-password" value={passwords.new_password} onChange={(event) => setPasswords((current) => ({ ...current, new_password: event.target.value }))} /></label>
            <label className="field"><span>Confirm new password</span><input type="password" required minLength={8} autoComplete="new-password" value={passwords.confirm_password} onChange={(event) => setPasswords((current) => ({ ...current, confirm_password: event.target.value }))} /></label>
            <div className="form-actions"><span className="settings-private-note"><ShieldCheck size={15} /> Existing sessions are revoked.</span><button className="button button-primary" disabled={savingPassword}><Check size={16} />{savingPassword ? "Updating..." : "Update password"}</button></div>
          </form>
        </section>
      </div>
      <section className="settings-security-note"><ShieldCheck size={17} /><div><strong>Account security</strong><span>Your applications, notes, reminders, and CVs are scoped to your authenticated account on the backend.</span></div></section>
    </div>
  );
}
