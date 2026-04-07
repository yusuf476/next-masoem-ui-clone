import Link from "next/link";
import { formatCurrency } from "../../../lib/format";
import { getOrderByOrderNumber, syncOrderPaymentStatus } from "../../../lib/market";

function resolveStatusCopy(order) {
  if (!order) {
    return {
      title: "Status pembayaran sedang diproses",
      description: "Kami belum menemukan detail pesanan. Coba buka dashboard Anda dalam beberapa saat.",
    };
  }

  if (order.paymentStatus === "paid") {
    return {
      title: "Pembayaran berhasil diterima",
      description: "Pesanan Anda sudah tercatat dan stok telah diperbarui.",
    };
  }

  if (order.paymentStatus === "expired") {
    return {
      title: "Pembayaran kedaluwarsa",
      description: "Silakan buat pembayaran baru dari dashboard jika masih ingin melanjutkan pesanan.",
    };
  }

  if (order.paymentStatus === "failed") {
    return {
      title: "Pembayaran belum berhasil",
      description: "Anda bisa mencoba lagi dari dashboard atau membuat pesanan baru.",
    };
  }

  return {
    title: "Pembayaran masih menunggu konfirmasi",
    description: "Midtrans sedang memproses transaksi Anda. Refresh dashboard beberapa saat lagi.",
  };
}

export default async function PaymentFinishPage({ searchParams }) {
  const params = await searchParams;
  const orderNumber = params.order || params.order_id || null;
  const order = orderNumber
    ? await syncOrderPaymentStatus(orderNumber).catch(async () => getOrderByOrderNumber(orderNumber))
    : null;
  const copy = resolveStatusCopy(order);

  return (
    <main className="container content-section">
      <section className="card empty-state stack-md">
        <span className="badge badge-strong">Payment Result</span>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        {order ? (
          <div className="stack-sm">
            <strong>{order.orderNumber}</strong>
            <p>
              Total: {formatCurrency(order.total)} | Status: {order.paymentStatus}
            </p>
          </div>
        ) : null}
        <div className="hero-actions">
          <Link href="/dashboard" className="button button-primary">
            Buka dashboard
          </Link>
          {order?.paymentStatus === "pending" && order.paymentUrl ? (
            <a href={order.paymentUrl} className="button button-secondary">
              Lanjutkan pembayaran
            </a>
          ) : (
            <Link href="/products" className="button button-secondary">
              Kembali belanja
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
