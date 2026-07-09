import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Sentrix Console"
        description="Sign in to the Sentrix Console — safety & security operations."
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
