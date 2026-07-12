import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authApi } from "../../services/api/auth";
import { ApiError } from "../../services/api/errors";

/**
 * The page the emailed reset link actually opens
 * ({APP_FRONTEND_URL}/password/reset/{token}?email=..., built in
 * IdentityServiceProvider::boot() via ResetPassword::createUrlUsing). Token
 * comes from the route param, email from the query string — both required by
 * NewPasswordController/ResetPasswordRequest alongside the new password.
 */
export default function ResetPasswordForm() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = !!token && !!email && password.length >= 8 && !mismatch && !submitting;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !email) {
      setError("This reset link is missing its token or email — request a new one.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, email, password });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reset your password. The link may have expired — request a new one.",
      );
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
              Set a new password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {email ? <>For {email}.</> : null} Choose a new password for your Sentrix account.
            </p>
          </div>

          {done ? (
            <div>
              <div className="p-3 mb-5 text-sm rounded-lg border border-success-500/30 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
                Your password has been reset. You've been signed out everywhere else for safety — sign in with your
                new password.
              </div>
              <Button className="w-full" size="sm" onClick={() => navigate("/signin", { replace: true })}>
                Go to sign in
              </Button>
            </div>
          ) : (
            <>
              {(!token || !email) && (
                <div className="p-3 mb-5 text-sm rounded-lg border border-error-500/30 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  This reset link looks incomplete.{" "}
                  <Link to="/forgot-password" className="underline">
                    Request a new one
                  </Link>
                  .
                </div>
              )}
              {error && (
                <div className="p-3 mb-5 text-sm rounded-lg border border-error-500/30 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      New password <span className="text-error-500">*</span>{" "}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
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
                      Confirm password <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password_confirmation"
                      placeholder="Re-enter the new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                    {mismatch && <p className="mt-1.5 text-sm text-error-500">Passwords do not match.</p>}
                  </div>
                  <div>
                    <Button className="w-full" size="sm" disabled={!canSubmit}>
                      {submitting ? "Resetting…" : "Reset password"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Remembered it?{" "}
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
