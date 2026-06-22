import './StartScreen.css';

interface Props {
  onStart: () => void;
}

// URL de l'image de fond du title screen.
// Pour la personnaliser : upload `public/assets/title.jpg`.
// Si absente, le fond dégradé sombre par défaut s'affiche.
const TITLE_BG_URL = `${import.meta.env.BASE_URL}assets/title.jpg`;

export function StartScreen({ onStart }: Props) {
  return (
    <div
      className="start-screen"
      style={{ '--title-bg': `url('${TITLE_BG_URL}')` } as React.CSSProperties}
    >
      <div className="start-vignette" aria-hidden />
      <div className="start-card">
        <div className="start-sigil">📚</div>
        <h1>Le Bureau des Archives Infinies</h1>
        <p className="start-intro">
          Dans les profondeurs du Bureau des Archives Infinies, trois héros s'avancent
          face à l'être le plus redouté des agents, élus et prestataires&nbsp;: <strong>le
          Champion des Collectivités Territoriales</strong>.
        </p>
        <ul className="start-roster">
          <li><span>🛡️</span> Datpaloof — Paladin elfe de sang</li>
          <li><span>🌀</span> Baghaar — Chaman occultiste</li>
          <li><span>🗡️</span> Zlatax — Chasseur de démon</li>
        </ul>
        <button className="start-button" onClick={onStart}>
          Pénétrer dans les archives
        </button>
      </div>
    </div>
  );
}
