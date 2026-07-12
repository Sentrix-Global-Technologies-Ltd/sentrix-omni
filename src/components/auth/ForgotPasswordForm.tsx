import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { authApi } from "../../services/api/auth";
import { ApiError } from "../../services/api/errors";

/**
 * Requests a password-reset link. Always shows the same "check your email"
 * confirmation regardless of whether the address matched an account — the
 * backend (PasswordResetLinkController) deliberately never reveals that, so
 * this form can't either without defeating the point.
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send a reset link. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Forgot password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter the email on your account and we'll send a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div className="p-3 mb-5 text-sm rounded-lg border border-success-500/30 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
              If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder).
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 mb-5 text-sm rounded-lg border border-error-500/30 bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@organization.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button className="w-full" size="sm" disabled={submitting || !email.trim()}>
                      {submitting ? "Sending…" : "Send reset link"}
                    </Button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
