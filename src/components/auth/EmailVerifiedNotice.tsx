import { useNavigate, useSearchParams } from "react-router";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";

/**
 * The page the emailed "Verify Email Address" link opens
 * ({APP_FRONTEND_URL}/email/verified?status=success, built in
 * VerifyEmailController::__invoke() on the backend). Mirrors
 * AcceptInvitationForm's role as "the landing page for an emailed link" —
 * same public-route placement in App.tsx (outside both GuestRoute and
 * ProtectedRoute, since the link must open regardless of auth state).
 *
 * Only web/dashboard signups receive this email now (see
 * SendEmailVerificationLink's docblock) — consumer/mobile signups verify via
 * a 6-digit OTP code in the app instead — but this page stays generic/safe
 * for anyone who does land here, dashboard user or not: no assumption is made
 * about whether they have (or want) a dashboard session.
 *
 * The backend never redirects here with anything other than status=success
 * today (an invalid/expired link 403s directly instead), but the query param
 * is still read defensively rather than hard-coding a single message.
 */
export default function EmailVerifiedNotice() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { status } = useAuth();
  const failed = params.get("status") === "failed";

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto text-center">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            failed ? "bg-error-50 dark:bg-error-500/10" : "bg-success-50 dark:bg-success-500/10"
          }`}
        >
          <span className={`text-2xl ${failed ? "text-error-500" : "text-success-500"}`}>
            {failed ? "✕" : "✓"}
          </span>
        </div>

        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          {failed ? "Verification link didn't work" : "Email verified"}
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {failed
            ? "This link may have expired or already been used. Sign in and you can request a fresh one from your account settings."
            : "Your email address is confirmed. You're all set."}
        </p>

        <Button className="w-full" size="sm" onClick={() => navigate(status === "authenticated" ? "/" : "/signin")}>
          {status === "authenticated" ? "Go to dashboard" : "Go to sign in"}
        </Button>
      </div>
    </div>
  );
}
