"use client";

export default function PrintResume() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print btn-primary"
    >
      Download / print PDF
    </button>
  );
}
