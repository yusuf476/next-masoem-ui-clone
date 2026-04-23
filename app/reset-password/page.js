import PasswordResetForm from "../../components/password-reset-form";

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const token = params.token || "";

  return (
    <main className="container auth-layout">
      <PasswordResetForm token={token} />

      <aside className="auth-aside">
        <div className="stack-md">
          <span className="badge badge-soft">Security</span>
          <h2>Password baru akan langsung menggantikan password lama Anda.</h2>
          <p>Simpan kombinasi yang kuat dan jangan gunakan password lama yang sama.</p>
        </div>
      </aside>
    </main>
  );
}
