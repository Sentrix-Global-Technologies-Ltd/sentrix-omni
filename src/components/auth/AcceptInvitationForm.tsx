import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { invitationsApi, type InvitationPreview } from "../../services/api/invitations";
import { ApiError } from "../../services/api/errors";

type Phase = "loading" | "invalid" | "auto-accepting" | "need-signin" | "need-password";

const errorBox =
  "p-3 mb-5 text-sm rounded-lg border border-error-500/30 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400";

/**
 * The page the emailed "Accept invitation" link actually opens
 * ({APP_FRONTEND_URL}/invitations/{token}/accept, built in
 * OrganizationInvitationNotification::toMail()). Mirrors ResetPasswordForm's
 * shape: token from the route param, everything else resolved from the
 * public preview endpoint.
 *
 * Three paths, decided once the preview loads:
 *  - already signed in (any account) -> auto-call the existing authenticated
 *    accept endpoint; the backend rejects it if the email doesn't match.
 *  - not signed in, an account already exists for the invited email -> a
 *    lightweight sign-in form, then accept.
 *  - not signed in, no account yet -> "set your password" — creates the
 *    account and joins the inviting organization ONLY (no throwaway personal
 *    org; see InvitationService::acceptWithNewAccount), then signs in via
 *    the normal useAuth().login() exactly as if typed on the sign-in screen.
 */
export default function AcceptInvitationForm() {
  const { token } = useParams<{ token: string }>();
  const { status: authStatus, login } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  // Load the invitation preview once.
  useEffect(() => {
    if (!token) {
      setPhase("invalid");
      setError("This invitation link is missing its token.");
      return;
    }
    invitationsApi
      .preview(token)
      .then(({ data }) => {
        setPreview(data);
        if (data.status === "expired") {
          setPhase("invalid");
          setError("This invitation has expired — ask whoever invited you to send a new one.");
        } else if (data.status === "accepted") {
          setPhase("invalid");
          setError("This invitation has already been accepted. Sign in to continue.");
        }
        // Otherwise, the effect below (which also watches auth status)
        // decides the path.
      })
      .catch(() => {
        setPhase("invalid");
        setError("This invitation link isn't valid — ask whoever invited you to send a new one.");
      });
  }, [token]);

  // Once both the preview and the auth status are known, decide the path.
  useEffect(() => {
    if (!preview || preview.status !== "pending" || authStatus === "loading" || !token) return;

    if (authStatus === "authenticated") {
      setPhase("auto-accepting");
      invitationsApi
        .acceptExisting(token)
        .then(() => {
          navigate("/", { replace: true });
        })
        .catch((e) => {
          setPhase("invalid");
          setError(e instanceof ApiError ? e.message : "Could not accept this invitation.");
        });
      return;
    }

    setPhase(preview.account_exists ? "need-signin" : "need-password");
  }, [preview, authStatus, token, navigate]);

  const submitSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preview || !token) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(preview.email, signinPassword);
      await invitationsApi.acceptExisting(token);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmitPassword = !!name && password.length >= 8 && !mismatch && !submitting;

  const submitNewAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!preview || !token) return;
    setError(null);
    setSubmitting(true);
    try {
      await invitationsApi.acceptNewAccount(token, { name, password });
      // Account now exists and is already a member of the org — sign in
      // exactly as if these credentials had been typed on the normal sign-in
      // screen (reuses useAuth().login(); no bespoke session handling here).
      await login(preview.email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not accept this invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Accept invitation
            </h1>
            {preview && phase !== "invalid" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You've been invited to join <strong>{preview.organization_name}</strong> as{" "}
                {preview.role}.
              </p>
            )}
          </div>

          {error && <div className={errorBox}>{error}</div>}

          {(phase === "loading" || phase === "auto-accepting") && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {phase === "loading" ? "Checking your invitation…" : "Joining the organization…"}
            </p>
          )}

          {phase === "invalid" && (
            <div className="mt-5">
              <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400 text-sm">
                Go to sign in
              </Link>
            </div>
          )}

          {phase === "need-signin" && preview && (
            <form onSubmit={submitSignIn}>
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You already have a Sentrix account for <strong>{preview.email}</strong> — sign in
                  to accept.
                </p>
                <div>
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={!signinPassword || submitting}>
                    {submitting ? "Signing in…" : "Sign in & accept"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {phase === "need-password" && preview && (
            <form onSubmit={submitNewAccount}>
              <div className="space-y-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Set a password for <strong>{preview.email}</strong> to create your account and
                  join.
                </p>
                <div>
                  <Label>
                    Your name <span className="text-error-500">*</span>
                  </Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Label>
                    Confirm password <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {mismatch && <p className="mt-1.5 text-sm text-error-500">Passwords do not match.</p>}
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={!canSubmitPassword}>
                    {submitting ? "Creating account…" : "Create account & join"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already sorted?{" "}
              <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
