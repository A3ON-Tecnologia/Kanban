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
    style={{ background: 'var(--overlay-dark)', backdropFilter: 'blur(8px)' }}
    onClick={onCancel}
  >
    <div
      className="rounded-xl p-6 w-full max-w-sm"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--danger-border)' }}
      onClick={e => e.stopPropagation()}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</p>
      {detail && (
        <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>{detail}</p>
      )}
      <div className="flex gap-3" style={{ marginTop: detail ? 0 : '1.25rem' }}>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'var(--danger-subtle)', color: '#f87171', border: '1px solid var(--danger-border)' }}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-sm"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
