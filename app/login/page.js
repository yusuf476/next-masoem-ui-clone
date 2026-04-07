import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "../../components/auth-form";
import { getCurrentUser } from "../../lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="container auth-layout">
      <AuthForm mode="login" />

      <aside className="auth-aside">
        <div className="stack-md">
          <span className="badge badge-soft">Student Access</span>
          <h2>Masuk dan lanjutkan aktivitas belanja kampus Anda.</h2>
          <p>
            Setelah login Anda bisa menyimpan keranjang, checkout lebih cepat, serta memantau semua
            transaksi dari dashboard pribadi.
          </p>
        </div>

        <div className="stack-sm">
          <p>Belum punya akun?</p>
          <Link href="/register" className="button button-secondary">
            Daftar sekarang
          </Link>
        </div>
      </aside>
    </main>
  );
}
