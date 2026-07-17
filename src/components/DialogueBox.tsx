// Boîte de dialogue JRPG : texte au clic / ESPACE / Entrée, effet machine à
// écrire, portrait couleur par interlocuteur.

import { useCallback, useEffect, useState } from 'react';
import type { DialogueDef } from '../data/dialogues';
import { playSfx } from '../game/core/sfx';
import './DialogueBox.css';

interface Props {
  dialogue: DialogueDef;
  onComplete: () => void;
}

export function DialogueBox({ dialogue, onComplete }: Props) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0); // caractères affichés (typewriter)

  const line = dialogue.lines[index];
  const fullText = line?.text ?? '';
  const done = shown >= fullText.length;

  useEffect(() => {
    setShown(0);
  }, [index, dialogue.id]);

  useEffect(() => {
    if (shown >= fullText.length) return;
    const t = setTimeout(() => setShown((s) => Math.min(fullText.length, s + 2)), 18);
    return () => clearTimeout(t);
  }, [shown, fullText]);

  const advance = useCallback(() => {
    playSfx('menu_move');
    if (!done) {
      setShown(fullText.length); // skip typewriter
      return;
    }
    if (index + 1 < dialogue.lines.length) {
      setIndex((i) => i + 1);
    } else {
      onComplete();
    }
  }, [done, fullText.length, index, dialogue.lines.length, onComplete]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance]);

  if (!line) return null;
  const isNarrator = line.speaker === '';

  return (
    <div className="dlg-overlay" onClick={advance}>
      <div className={`dlg-box ${isNarrator ? 'narrator' : ''}`}>
        {!isNarrator && (
          <div className="dlg-speaker" style={{ color: line.color ?? '#ffe080' }}>
            {line.speaker}
          </div>
        )}
        <div className="dlg-text">
          {fullText.slice(0, shown)}
          {done && <span className="dlg-next">▼</span>}
        </div>
        <div className="dlg-progress">{index + 1}/{dialogue.lines.length}</div>
      </div>
    </div>
  );
}
