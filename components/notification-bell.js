"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppViewer } from "./app-viewer";

function formatRelativeTime(value) {
  return new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" }).format(
    Math.round((new Date(value).getTime() - Date.now()) / (60 * 60 * 1000)),
    "hour",
  );
}

function getIcon(type) {
  switch (type) {
    case "order":
      return <span style={{ fontSize: "1.2rem" }}>Ord</span>;
    case "promo":
      return <span style={{ fontSize: "1.2rem" }}>Hot</span>;
    case "system":
      return <span style={{ fontSize: "1.2rem" }}>Sys</span>;
    default:
      return <span style={{ fontSize: "1.2rem" }}>New</span>;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { viewer, unreadNotificationCount, markNotificationsRead } = useAppViewer();
  const notifications = viewer.notifications || [];
  const hasUser = Boolean(viewer.user);

  useEffect(() => {
    if (!hasUser) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hasUser]);

  if (!hasUser) {
    return null;
  }

  function handleOpen() {
    setOpen((current) => !current);

    if (!open && unreadNotificationCount > 0) {
      if (typeof window !== "undefined" && window.triggerHaptic) {
        window.triggerHaptic("light");
      }

      markNotificationsRead().catch(() => {});
    }
  }

  return (
    <div className={`notification-wrapper ${open ? "open" : ""}`} ref={wrapperRef}>
      <button className="notification-bell-btn" onClick={handleOpen} aria-label="Notifikasi">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadNotificationCount > 0 ? (
          <span className="notification-badge">{unreadNotificationCount}</span>
        ) : null}
      </button>

      <div className="notification-dropdown">
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Notifikasi</h3>
          {unreadNotificationCount > 0 ? (
            <span className="badge badge-soft" style={{ fontSize: "0.7rem" }}>
              {unreadNotificationCount} Baru
            </span>
          ) : null}
        </div>

        <div style={{ maxHeight: "350px", overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
              Belum ada notifikasi baru.
            </div>
          ) : (
            notifications.map((notif) => (
              <Link key={notif.id} href={notif.href} className={`notif-item ${notif.readAt ? "" : "unread"}`} onClick={() => setOpen(false)}>
                <div className="notif-icon">{getIcon(notif.type)}</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.88rem" }}>{notif.title}</strong>
                  <p style={{ margin: "0 0 4px", fontSize: "0.9rem", lineHeight: "1.4" }}>{notif.message}</p>
                  <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>
                    {formatRelativeTime(notif.createdAt)}
                  </small>
                </div>
              </Link>
            ))
          )}
        </div>

        <div style={{ padding: "12px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <Link href="/dashboard" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }} onClick={() => setOpen(false)}>
            Lihat Semua Aktivitas
          </Link>
        </div>
      </div>
    </div>
  );
}
