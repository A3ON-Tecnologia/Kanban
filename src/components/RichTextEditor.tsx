import React, { useEffect, useRef } from 'react';
import { toHtml } from '../richtext';

interface Props {
  // Valor bruto vindo do card (HTML novo ou markdown antigo).
  value: string;
  onChange: (html: string) => void;
  // Muda quando o card aberto muda, para reinicializar o conteúdo.
  resetKey: string;
  minHeight: number;
  maxHeight: number;
  resize?: boolean;
  placeholder?: string;
}

/**
 * Editor rico (WYSIWYG) baseado em contentEditable.
 * O que você digita já aparece formatado — negrito, listas — sem markdown cru.
 * Emite HTML via onChange. É "não-controlado": o innerHTML é semeado uma vez
 * (e a cada troca de card) para não bagunçar o cursor a cada tecla.
 */
const RichTextEditor: React.FC<Props> = ({ value, onChange, resetKey, minHeight, maxHeight, resize, placeholder }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  // Semeia o conteúdo ao montar e sempre que trocar de card.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = toHtml(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const emit = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const exec = (command: string) => {
    ref.current?.focus();
    document.execCommand(command, false);
    emit();
  };

  const isEmpty = !value || value === '<div><br></div>' || value === '<br>';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 mb-2">
        <button type="button" title="Negrito" onMouseDown={e => e.preventDefault()} onClick={() => exec('bold')}
          className="px-2 py-1 rounded text-sm font-bold border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all">B</button>
        <button type="button" title="Itálico" onMouseDown={e => e.preventDefault()} onClick={() => exec('italic')}
          className="px-2 py-1 rounded text-sm italic border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all">I</button>
        <button type="button" title="Lista ordenada" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertOrderedList')}
          className="px-2 py-1 rounded text-sm border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all">1.</button>
        <button type="button" title="Lista com marcadores" onMouseDown={e => e.preventDefault()} onClick={() => exec('insertUnorderedList')}
          className="px-2 py-1 rounded text-sm border border-gray-700 bg-gray-800 hover:bg-gray-700 transition-all">•</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder ?? ''}
        className={`rte w-full rounded-lg p-3 text-sm outline-none overflow-y-auto${isEmpty ? ' rte-empty' : ''}`}
        style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border)',
          minHeight,
          maxHeight,
          resize: resize ? 'vertical' : 'none',
          color: 'var(--text-primary)',
          lineHeight: 1.6,
          transition: 'max-height 0.2s',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
