export function HelpTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="help-tip">
      <summary aria-label={label} title={label}>
        ?
      </summary>
      <div className="help-tip__bubble" role="tooltip">
        {children}
      </div>
    </details>
  );
}
