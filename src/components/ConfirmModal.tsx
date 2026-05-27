import React from 'react';

interface Props {
  title: string;
  detail?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<Props> = ({
  title,
  detail,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(13,15,22,0.85)', backdropFilter: 'blur(8px)' }}
    onClick={onCancel}
  >
    <div
      className="rounded-xl p-6 w-full max-w-sm"
      style={{ background: '#1b1e2f', border: '1px solid rgba(248,113,113,0.3)' }}
      onClick={e => e.stopPropagation()}
    >
      <p className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>{title}</p>
      {detail && (
        <p className="text-sm mb-5" style={{ color: '#7a7f8c' }}>{detail}</p>
      )}
      <div className="flex gap-3" style={{ marginTop: detail ? 0 : '1.25rem' }}>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-sm"
          style={{ background: '#242838', color: '#7a7f8c' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
