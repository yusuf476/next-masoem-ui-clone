"use client";

import { useState } from "react";
import { DashboardIcon, PackageIcon } from "./icons";

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);

export default function AdminTabs({ overviewTab, ordersTab, productsTab }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="admin-tabs-container">
      <nav className="admin-tabs-nav" aria-label="Admin Navigation">
        <button
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <DashboardIcon />
          <span>Ringkasan</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <ListIcon />
          <span>Pesanan</span>
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <PackageIcon />
          <span>Katalog Produk</span>
        </button>
      </nav>

      <div className="admin-tabs-content">
        {activeTab === "overview" && (
          <div className="admin-tab-pane slide-fade-in">{overviewTab}</div>
        )}
        {activeTab === "orders" && (
          <div className="admin-tab-pane slide-fade-in">{ordersTab}</div>
        )}
        {activeTab === "products" && (
          <div className="admin-tab-pane slide-fade-in">{productsTab}</div>
        )}
      </div>
    </div>
  );
}
