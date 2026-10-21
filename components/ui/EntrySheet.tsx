"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  saveLabel: string;
  saving?: boolean;
  dirty: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
};

export default function EntrySheet({ open, title, saveLabel, saving, dirty, onClose, onSave, children }: Props) {
  const [discard, setDiscard] = useState(false);

  useEffect(() => {
    if (!open) setDiscard(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (discard) {
        setDiscard(false);
        return;
      }
      if (dirty) setDiscard(true);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dirty, discard, onClose]);

  if (!open) return null;

  function requestClose() {
    if (saving) return;
    if (dirty) setDiscard(true);
    else onClose();
  }

  return (
    <div className="exp-modal" role="dialog" aria-modal="true" aria-labelledby="entry-sheet-title">
      <button className="exp-modal-backdrop" type="button" aria-label="Close" onClick={requestClose} />
      <div className="exp-sheet">
        <header className="exp-sheet-head">
          <h3 id="entry-sheet-title">{title}</h3>
          <button className="exp-close" type="button" aria-label="Close" onClick={requestClose}>×</button>
        </header>
        <div className="exp-sheet-body">{children}</div>
        <footer className="exp-sheet-foot">
          <button className="exp-submit" type="button" disabled={saving} onClick={onSave}>{saving ? "Saving..." : saveLabel}</button>
        </footer>
      </div>
      {discard && (
        <div className="discard-layer" role="dialog" aria-modal="true" aria-labelledby="entry-discard-title">
          <div className="discard-card">
            <h3 id="entry-discard-title">Discard changes?</h3>
            <p>You have unsaved changes. Are you sure you want to close?</p>
            <div className="discard-actions">
              <button className="action" type="button" onClick={() => setDiscard(false)}>Keep editing</button>
              <button className="action danger-action" type="button" onClick={() => { setDiscard(false); onClose(); }}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
