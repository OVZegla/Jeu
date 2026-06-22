import { useEffect } from 'react';
import './StartScreen.css';

interface Props {
  onStart: () => void;
}

const TITLE_BG_URL = `${import.meta.env.BASE_URL}assets/title.jpg`;

export function StartScreen({ onStart }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Toute touche déclenche le démarrage (sauf Tab pour ne pas casser
      // la navigation clavier des dev outils)
      if (e.key === 'Tab') return;
      onStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart]);

  return (
    <div
      className="start-screen"
      onClick={onStart}
      style={{ backgroundImage: `url('${TITLE_BG_URL}')` }}
    />
  );
}
