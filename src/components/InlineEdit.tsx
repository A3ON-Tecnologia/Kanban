import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  inputClassName?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  placeholder?: string;
  textColor?: string;
  style?: React.CSSProperties;
}

const InlineEdit: React.FC<Props> = ({
  value,
  onSave,
  className = '',
  inputClassName = '',
  tag: Tag = 'span',
  placeholder = 'Sem título',
  textColor = 'rgba(255,255,255,0.9)',
  style,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value); setEditing(false); }
  };

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`w-full resize-none rounded px-1 outline-none text-inherit font-inherit ${inputClassName}`}
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(34,211,238,0.5)', color: textColor }}
        rows={2}
      />
    );
  }

  return (
    <Tag
      className={`cursor-pointer rounded px-1 -mx-1 transition-colors ${className}`}
      style={{ color: textColor, ...style }}
      onClick={() => setEditing(true)}
      title="Clique para editar"
    >
      {value || <span style={{ opacity: 0.3 }}>{placeholder}</span>}
    </Tag>
  );
};

export default InlineEdit;
