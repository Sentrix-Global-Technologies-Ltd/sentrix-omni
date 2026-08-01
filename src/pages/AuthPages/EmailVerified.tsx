import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import EmailVerifiedNotice from "../../components/auth/EmailVerifiedNotice";

export default function EmailVerified() {
  return (
    <>
      <PageMeta
        title="Email Verified | Sentrix Console"
        description="Your Sentrix email address has been verified."
      />
      <AuthLayout>
        <EmailVerifiedNotice />
      </AuthLayout>
    </>
  );
}
