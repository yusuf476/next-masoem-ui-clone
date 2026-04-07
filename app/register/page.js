import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "../../components/auth-form";
import { getCurrentUser } from "../../lib/session";

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="container auth-layout">
      <AuthForm mode="register" />

      <aside className="auth-aside">
        <div className="stack-md">
          <span className="badge badge-soft">New Account</span>
          <h2>Buat akun dan aktifkan semua fitur web marketplace kampus.</h2>
          <p>
            Dengan satu akun Anda dapat menyimpan riwayat order, mempercepat checkout, dan mendapat
            pengalaman personal yang konsisten di seluruh aplikasi.
          </p>
        </div>

        <div className="stack-sm">
          <p>Sudah punya akun?</p>
          <Link href="/login" className="button button-secondary">
            Masuk di sini
          </Link>
        </div>
      </aside>
    </main>
  );
}
