"use client";

export default function VisualTracker({ status }) {
  const steps = [
    { key: "payment", label: "Pembayaran" },
    { key: "confirmed", label: "Dikonfirmasi" },
    { key: "preparing", label: "Disiapkan" },
    { key: "delivery", label: "Siap / Antar" },
    { key: "completed", label: "Selesai" },
  ];

  const normalizedStatus = String(status || "").toLowerCase();
  let activeIndex = 0;

  if (normalizedStatus.includes("awaiting payment") || normalizedStatus.includes("pending")) {
    activeIndex = 0;
  } else if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("confirmed")
  ) {
    activeIndex = 1;
  } else if (normalizedStatus.includes("preparing")) {
    activeIndex = 2;
  } else if (
    normalizedStatus.includes("pickup") ||
    normalizedStatus.includes("delivery") ||
    normalizedStatus.includes("antar")
  ) {
    activeIndex = 3;
  } else if (normalizedStatus.includes("complete") || normalizedStatus.includes("selesai")) {
    activeIndex = 4;
  }

  return (
    <div className="visual-tracker">
      {steps.map((step, idx) => {
        let stepClass = "tracker-step ";
        if (idx < activeIndex) stepClass += "completed";
        else if (idx === activeIndex) stepClass += "active";
        
        return (
          <div key={step.key} className={stepClass}>
            <div className="tracker-dot"></div>
            <span className="tracker-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
