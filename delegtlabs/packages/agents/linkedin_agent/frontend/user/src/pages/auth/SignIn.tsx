import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { authApi, sessionApi } from "@shared/api";
import { LINKEDIN_LOGIN_URL } from "@shared/components/shared-ui";

import "./auth-form.css";

/**
 * Auth entry point — three modes over one form.
 *
 *   sign in:  email + password                                      -> dashboard
 *   sign up:  name + email -> emailed code -> choose a password     -> dashboard
 *   forgot:   email        -> emailed code + new password           -> dashboard
 *
 * Password is the everyday credential; the one-time code's job is to prove the address
 * before it carries one, and to authorise a reset. Signing up therefore verifies first
 * and sets the password second — by the time /auth/password/set is called the user is
 * already signed in, so an abandoned signup leaves a usable account rather than a
 * half-built one they cannot get back into.
 *
 * LinkedIn stays a separate one-click path (endpoints/auth.py). A LinkedIn user never
 * needs a password; they can add one later from Settings.
 */
type Mode = "signin" | "signup" | "forgot";
type Step = "details" | "code" | "password" | "reset";

const MIN_PASSWORD = 8;

function errorMessage(err: unknown, fallback: string): string {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data
    ?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors arrive as a list of {msg, loc} objects.
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === "string") return first.msg;
  }
  return fallback;
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="#0A66C2"
      aria-hidden="true"
      width="18"
      height="18"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>(
    location.pathname.startsWith("/signup") ? "signup" : "signin",
  );
  const [step, setStep] = useState<Step>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [code, setCode] = useState("");
  const [devMode, setDevMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);
  const isSignup = mode === "signup";
  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");

  // Surface an OAuth failure bounced back from /auth/linkedin/callback.
  useEffect(() => {
    const authError = new URLSearchParams(location.search).get("auth_error");
    if (!authError) return;
    toast.error("LinkedIn sign-in failed", {
      description: decodeURIComponent(authError.replace(/\+/g, " ")),
      duration: 12_000,
    });
    navigate({ pathname: location.pathname, search: "" }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code" || step === "reset") codeInputRef.current?.focus();
  }, [step]);

  function resetForm(next: Mode) {
    setMode(next);
    setStep("details");
    setCode("");
    setPassword("");
    setConfirm("");
  }

  function switchMode(next: Mode) {
    resetForm(next);
    if (next !== "forgot") {
      navigate(next === "signup" ? "/signup" : "/signin", { replace: true });
    }
  }

  async function finish(message: string) {
    await queryClient.invalidateQueries();
    toast.success(message);
    navigate("/dashboard", { replace: true });
  }

  // --- sign in -------------------------------------------------------------
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await sessionApi.loginPassword({ email: email.trim().toLowerCase(), password });
      await finish("Signed in");
    } catch (err) {
      toast.error(errorMessage(err, "Could not sign you in"));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  // --- sign up -------------------------------------------------------------
  async function sendSignupCode(isResend = false) {
    setBusy(true);
    try {
      const target = email.trim().toLowerCase();
      const res = await sessionApi.startEmail(target);
      setDevMode(res.dev_mode);
      setEmail(target);

      // Choosing the wrong mode is recoverable, not an error.
      if (!res.is_new) {
        toast.info("You already have an account — sign in with your password instead.");
        switchMode("signin");
        return;
      }

      setCooldown(res.resend_in_seconds);
      setStep("code");
      if (isResend) toast.success("New code sent");
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the code"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifySignupCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      // Verifying signs the user in; the password step then runs authenticated.
      await sessionApi.verifyEmail({
        email,
        code: code.trim(),
        full_name: fullName || undefined,
      });
      setStep("password");
    } catch (err) {
      toast.error(errorMessage(err, "Could not verify that code"));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Those passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await sessionApi.setPassword({ password });
      await finish(`Welcome, ${firstName.trim() || "there"} — your workspace is ready.`);
    } catch (err) {
      toast.error(errorMessage(err, "Could not set that password"));
    } finally {
      setBusy(false);
    }
  }

  // --- forgot password -----------------------------------------------------
  async function sendResetCode(isResend = false) {
    setBusy(true);
    try {
      const target = email.trim().toLowerCase();
      const res = await sessionApi.forgotPassword(target);
      setDevMode(res.dev_mode);
      setEmail(target);
      setCooldown(res.resend_in_seconds);
      setStep("reset");
      if (isResend) toast.success("New code sent");
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the code"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Those passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await sessionApi.resetPassword({ email, code: code.trim(), password });
      await finish("Password updated — you're signed in.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not reset your password"));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  const passwordFields = (
    <>
      <label>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          placeholder=" "
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span>New password</span>
      </label>
      <label>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD}
          placeholder=" "
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <span>Confirm password</span>
      </label>
      <p className="message" style={{ fontSize: 12 }}>
        At least {MIN_PASSWORD} characters. Length beats punctuation — a short phrase you
        will remember is stronger than a mangled word.
      </p>
    </>
  );

  const passwordsOk =
    password.length >= MIN_PASSWORD && confirm.length >= MIN_PASSWORD;

  // === signup: choose a password ==========================================
  if (step === "password") {
    return (
      <div className="auth-shell">
        <form className="form" onSubmit={handleCreatePassword}>
          <p className="title">Choose a password</p>
          <p className="message">
            <strong>{email}</strong> is verified. Set a password and you can sign in with
            it from now on.
          </p>
          {passwordFields}
          <button className="submit" type="submit" disabled={busy || !passwordsOk}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Create my workspace
          </button>
        </form>
      </div>
    );
  }

  // === forgot: code + new password ========================================
  if (step === "reset") {
    return (
      <div className="auth-shell">
        <form className="form" onSubmit={handleReset}>
          <p className="title">Reset password</p>
          <p className="message">
            If <strong>{email}</strong> has an account, a 6-digit code is on its way.
          </p>

          <label>
            <input
              className="input code"
              ref={codeInputRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{4,6}"
              maxLength={6}
              required
              placeholder=" "
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <span>6-digit code</span>
          </label>

          {passwordFields}

          {devMode && (
            <p className="dev-hint">
              Developer mode is on — the code <strong>123456</strong> is accepted.
            </p>
          )}

          <button
            className="submit"
            type="submit"
            disabled={busy || code.length < 4 || !passwordsOk}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            Set new password
          </button>

          <div className="form-meta">
            <button type="button" onClick={() => switchMode("signin")}>
              ← Back to sign in
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void sendResetCode(true)}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // === signup: verify the emailed code ====================================
  if (step === "code") {
    return (
      <div className="auth-shell">
        <form className="form" onSubmit={handleVerifySignupCode}>
          <p className="title">Verify</p>
          <p className="message">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>

          <label>
            <input
              className="input code"
              ref={codeInputRef}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{4,6}"
              maxLength={6}
              required
              placeholder=" "
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <span>6-digit code</span>
          </label>

          {devMode && (
            <p className="dev-hint">
              Developer mode is on — the code <strong>123456</strong> is accepted.
            </p>
          )}

          <button className="submit" type="submit" disabled={busy || code.length < 4}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Continue
          </button>

          <div className="form-meta">
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setCode("");
              }}
            >
              ← Back
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void sendSignupCode(true)}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // === forgot: ask for the address ========================================
  if (mode === "forgot") {
    return (
      <div className="auth-shell">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void sendResetCode();
          }}
        >
          <p className="title">Forgot password</p>
          <p className="message">
            Enter your email and we'll send a code to reset your password.
          </p>

          <label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder=" "
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <span>Email</span>
          </label>

          <button className="submit" type="submit" disabled={busy || !email.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            Send reset code
          </button>

          <p className="signin">
            <button type="button" onClick={() => switchMode("signin")}>
              ← Back to sign in
            </button>
          </p>
        </form>
      </div>
    );
  }

  // === sign in / sign up: the entry form ==================================
  return (
    <div className="auth-shell">
      <form
        className="form"
        onSubmit={
          isSignup
            ? (e) => {
                e.preventDefault();
                void sendSignupCode();
              }
            : handleSignIn
        }
      >
        <p className="title">{isSignup ? "Register" : "Sign in"}</p>
        <p className="message">
          {isSignup
            ? "Sign up now and get full access to AntGrav."
            : "Welcome back. Sign in with your email and password."}
        </p>

        <a className="oauth-button" href={authApi.loginUrl()}>
          <LinkedInIcon />
          {isSignup ? "Sign up with LinkedIn" : "Sign in with LinkedIn"}
        </a>

        {/* See LinkedInSessionHint in shared-ui for why this is a hint, not a gate.
            Restated here because the auth shell is plain CSS, not Tailwind. */}
        <p className="oauth-hint">
          Created your LinkedIn account with Google? LinkedIn will ask for a password it
          never gave you.{" "}
          <a href={LINKEDIN_LOGIN_URL} target="_blank" rel="noreferrer noopener">
            Sign in to LinkedIn first ↗
          </a>{" "}
          — then come back.
        </p>

        <div className="divider">or</div>

        {isSignup && (
          <div className="flex">
            <label>
              <input
                className="input"
                type="text"
                autoComplete="given-name"
                placeholder=" "
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <span>Firstname</span>
            </label>

            <label>
              <input
                className="input"
                type="text"
                autoComplete="family-name"
                placeholder=" "
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <span>Lastname</span>
            </label>
          </div>
        )}

        <label>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder=" "
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <span>Email</span>
        </label>

        {!isSignup && (
          <label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder=" "
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span>Password</span>
          </label>
        )}

        <button
          className="submit"
          type="submit"
          disabled={
            busy ||
            !email.trim() ||
            (isSignup ? !fullName : password.length === 0)
          }
        >
          {busy && <Loader2 className="size-4 animate-spin" />}
          {isSignup ? "Continue" : "Sign in"}
        </button>

        {isSignup ? (
          <p className="message" style={{ fontSize: 12, textAlign: "center" }}>
            We'll email you a 6-digit code, then you choose a password.
          </p>
        ) : (
          <p className="message" style={{ fontSize: 12, textAlign: "center" }}>
            <button
              type="button"
              className="linklike"
              onClick={() => resetForm("forgot")}
            >
              Forgot password?
            </button>
          </p>
        )}

        <p className="signin">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button type="button" onClick={() => switchMode(isSignup ? "signin" : "signup")}>
            {isSignup ? "Signin" : "Signup"}
          </button>
        </p>
      </form>
    </div>
  );
}
