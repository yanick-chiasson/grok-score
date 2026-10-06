import { useState } from 'react';

export function Sheet({ onClose, children }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function RenameSheet({ title, value, onSave, onClose }) {
  const [v, setV] = useState(value);
  const save = () => {
    if (v.trim()) onSave(v.trim());
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <div className="label">{title}</div>
      <input className="input" autoFocus value={v} maxLength={24} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
      <div className="row">
        <button className="btn btn-ghost grow" onClick={onClose}>Cancel</button>
        <button className="btn btn-gold grow" onClick={save}>Save</button>
      </div>
    </Sheet>
  );
}
