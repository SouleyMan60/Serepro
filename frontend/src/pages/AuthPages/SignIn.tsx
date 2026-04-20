import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Connexion | SEREPRO - RH &amp; Finance CI"
        description="Connectez-vous à votre espace SEREPRO"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
