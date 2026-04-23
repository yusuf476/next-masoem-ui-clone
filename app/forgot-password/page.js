import Link from "next/link";
import PasswordResetRequestForm from "../../components/password-reset-request-form";

export default function ForgotPasswordPage() {
  return (
    <main className="container auth-layout">
      <PasswordResetRequestForm />

      <aside className="auth-aside">
        <div className="stack-md">
          <span className="badge badge-soft">Recovery</span>
          <h2>Kehilangan akses akun? Kita siapkan jalur recovery yang lebih aman.</h2>
          <p>
            Tautan reset password akan membantu Anda kembali masuk tanpa harus membuat akun baru.
          </p>
        </div>

        <div className="stack-sm">
          <p>Ingat password Anda?</p>
          <Link href="/login" className="button button-secondary">
            Kembali ke login
          </Link>
        </div>
      </aside>
    </main>
  );
}
