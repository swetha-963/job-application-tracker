import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (isRegister) {
        if (values.password !== values.confirm_password) {
          setError("Your passwords do not match.");
          setSaving(false);
          return;
        }
        await register({
          username: values.username,
          email: values.email,
          first_name: values.first_name,
          last_name: values.last_name,
          password: values.password,
        });
      }
      await login(values.username, values.password);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(errorMessage(requestError, "We could not sign you in. Check your details and try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <Link to="/" className="brand-lockup">
          <div className="brand-mark">C</div>
          <div><strong>careerflow</strong><span>JOB SEARCH, IN FOCUS</span></div>
        </Link>
        <div className="auth-brand-message">
          <p className="eyebrow">CAREERFLOW WORKSPACE</p>
          <h1>Small steps add up to the right next move.</h1>
          <p>Bring your job search into focus, one thoughtful follow-up at a time.</p>
          <div className="auth-brand-note"><Briefcase size={18} /><span>Built for every part of the journey.</span></div>
        </div>
        <div className="auth-brand-footer">Your next chapter starts with one clear step.</div>
        <div className="auth-art-shape shape-a" /><div className="auth-art-shape shape-b" />
      </section>
      <section className="auth-form-panel">
        <Link to="/" className="auth-back"><ArrowLeft size={16} /> Back to CareerFlow</Link>
        <div className="auth-form-wrap">
          <div className="auth-form-icon"><UserRound size={21} /></div>
          <p className="eyebrow">{isRegister ? "CREATE YOUR ACCOUNT" : "WELCOME BACK"}</p>
          <h2>{isRegister ? "Start your CareerFlow" : "Sign in to your workspace"}</h2>
          <p className="auth-subtitle">{isRegister ? "Create a private space for your job search." : "Pick up where you left off."}</p>
          <form onSubmit={submit} className="auth-form">
            {isRegister && (
              <>
                <div className="auth-name-row">
                  <label className="field"><span>First name</span><input name="first_name" value={values.first_name} onChange={update} autoComplete="given-name" placeholder="First name" /></label>
                  <label className="field"><span>Last name</span><input name="last_name" value={values.last_name} onChange={update} autoComplete="family-name" placeholder="Last name" /></label>
                </div>
                <label className="field"><span>Email address</span><div className="input-icon-wrap"><Mail size={17} /><input name="email" type="email" value={values.email} onChange={update} autoComplete="email" required placeholder="you@example.com" /></div></label>
              </>
            )}
            <label className="field"><span>Username</span><div className="input-icon-wrap"><UserRound size={17} /><input name="username" value={values.username} onChange={update} autoComplete="username" required placeholder="Your username" /></div></label>
            <label className="field"><span>Password</span><div className="input-icon-wrap"><LockKeyhole size={17} /><input name="password" type={showPassword ? "text" : "password"} value={values.password} onChange={update} autoComplete={isRegister ? "new-password" : "current-password"} required minLength={8} placeholder="At least 8 characters" /><button type="button" className="password-toggle" onClick={() => setShowPassword((show) => !show)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
            {isRegister && <label className="field"><span>Confirm password</span><input name="confirm_password" type={showPassword ? "text" : "password"} value={values.confirm_password} onChange={update} autoComplete="new-password" required placeholder="Enter your password again" /></label>}
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="button button-primary auth-submit" disabled={saving}>
              {saving ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
              {!saving && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? "Already have an account?" : "New to CareerFlow?"}
            {" "}<Link to={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link>
          </p>
          <p className="auth-privacy">Your workspace is private and only visible to you.</p>
        </div>
      </section>
    </main>
  );
}
