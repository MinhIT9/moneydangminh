import './game.css';

export default function GamesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="game-surface">{children}</div>;
}
