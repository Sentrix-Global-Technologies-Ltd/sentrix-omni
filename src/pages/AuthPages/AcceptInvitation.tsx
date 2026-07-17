import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import AcceptInvitationForm from "../../components/auth/AcceptInvitationForm";

export default function AcceptInvitation() {
  return (
    <>
      <PageMeta
        title="Accept Invitation | Sentrix Console"
        description="Accept your invitation to join an organization on Sentrix."
      />
      <AuthLayout>
        <AcceptInvitationForm />
      </AuthLayout>
    </>
  );
}
