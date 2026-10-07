"use client";

export default function PrintResume({ username }: { username: string }) {
  return (
    <button
      type="button"
      className="cv-download"
      onClick={() => {
        document.title = `${username} PowFolio`;
        window.print();
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 4v10" />
        <path d="m8 10 4 4 4-4" className="cv-arrow" />
        <path d="M5 19h14" />
      </svg>
      Download
    </button>
  );
}
