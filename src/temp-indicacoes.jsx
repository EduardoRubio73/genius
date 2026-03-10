import { useState } from "react";

const mockData = {
  confirmedReferrals: 1,
  creditsEarned: 1,
  bonusAvailable: 1,
  nextBonusAt: 10,
  inviteLink: "https://genius-engineer.lovable.app/?ref=GENIUS-C9A5F",
  history: [
    { date: "10/03/2026", status: "Bônus concedido" },
  ],
};

export default function IndicacoesPage() {
  const [copied, setCopied] = useState(false);
  const [bonusUsed, setBonusUsed] = useState(false);

  const progress = (mockData.confirmedReferrals / mockData.nextBonusAt) * 100;
  const remaining = mockData.nextBonusAt - mockData.confirmedReferrals;
  const firstConfirmed = mockData.confirmedReferrals >= 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(mockData.inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareBonus = () => {
    setBonusUsed(true);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f5f5f7", minHeight: "100vh", padding: "0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { display: flex; min-height: 100vh; }
        .sidebar {
          width: 220px;
          background: #fff;
          border-right: 1px solid #ebebeb;
          padding: 28px 0;
          flex-shrink: 0;
        }
        .sidebar-title {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 24px 24px;
          font-size: 17px;
          font-weight: 700;
          color: #18181b;
          border-bottom: 1px solid #f0f0f0;
          margin-bottom: 8px;
        }
        .sidebar-icon { font-size: 18px; }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 24px;
          font-size: 14px;
          color: #71717a;
          cursor: pointer;
          border-radius: 0;
          font-weight: 400;
          transition: background 0.15s;
        }
        .nav-item:hover { background: #fafafa; color: #18181b; }
        .nav-item.active { color: #7c3aed; font-weight: 600; background: #f5f3ff; }
        .content { flex: 1; padding: 36px 40px; max-width: 820px; }
        .page-title { font-size: 22px; font-weight: 700; color: #18181b; margin-bottom: 28px; }

        /* Cards */
        .card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 14px;
          padding: 24px;
          margin-bottom: 16px;
        }
        .card-title { font-size: 15px; font-weight: 700; color: #18181b; margin-bottom: 4px; }
        .card-sub { font-size: 13px; color: #71717a; margin-bottom: 16px; }

        /* Programa de indicações */
        .rules-grid { display: flex; flex-direction: column; gap: 10px; }
        .rule-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          border: 1px solid #ebebeb;
          background: #fafafa;
        }
        .rule-item.done {
          background: #f0fdf4;
          border-color: #bbf7d0;
          opacity: 0.85;
        }
        .rule-item.done .rule-title { color: #15803d; }
        .rule-item.active {
          background: #f5f3ff;
          border-color: #ddd6fe;
        }
        .rule-icon { font-size: 18px; margin-top: 1px; flex-shrink: 0; }
        .rule-title { font-size: 13px; font-weight: 600; color: #18181b; margin-bottom: 2px; }
        .rule-desc { font-size: 12.5px; color: #71717a; line-height: 1.4; }
        .badge-done {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          background: #dcfce7;
          color: #15803d;
          padding: 3px 9px;
          border-radius: 20px;
          flex-shrink: 0;
        }

        /* Stats */
        .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .stat-card {
          background: #fff;
          border: 1px solid #ebebeb;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          background: #f5f3ff;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .stat-label { font-size: 12px; color: #71717a; margin-bottom: 2px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #18181b; line-height: 1; }
        .stat-sub { font-size: 11px; color: #a1a1aa; margin-top: 2px; }

        /* Progress */
        .progress-card { padding: 20px 24px; }
        .progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .progress-label { font-size: 13px; font-weight: 600; color: #18181b; }
        .progress-pct { font-size: 12px; color: #7c3aed; font-weight: 600; }
        .progress-bar-bg { background: #f0eeff; border-radius: 99px; height: 10px; overflow: hidden; }
        .progress-bar-fill {
          height: 10px;
          border-radius: 99px;
          background: linear-gradient(90deg, #7c3aed, #a855f7);
          transition: width 0.4s ease;
        }
        .progress-hint { font-size: 12px; color: #71717a; margin-top: 8px; }

        /* Invite + Bonus unified */
        .invite-section { }
        .invite-link-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 16px;
        }
        .invite-link-input {
          flex: 1;
          background: #f5f5f7;
          border: 1px solid #ebebeb;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #52525b;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .btn-primary {
          background: #7c3aed;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.15s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary:hover { background: #6d28d9; }
        .btn-secondary {
          background: #fff;
          color: #7c3aed;
          border: 1.5px solid #ddd6fe;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-secondary:hover { background: #f5f3ff; }
        .divider { border: none; border-top: 1px solid #f0f0f0; margin: 16px 0; }
        .bonus-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .bonus-info { flex: 1; }
        .bonus-label { font-size: 13px; font-weight: 600; color: #18181b; margin-bottom: 3px; }
        .bonus-desc { font-size: 12.5px; color: #71717a; }
        .bonus-count {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          flex-shrink: 0;
        }
        .bonus-used-msg {
          font-size: 12px;
          color: #a1a1aa;
          font-style: italic;
          padding: 10px 0 2px;
          text-align: center;
        }
        .hint-text { font-size: 12px; color: #a1a1aa; margin-top: 10px; }
        .hint-text span { color: #7c3aed; font-weight: 600; }

        /* History */
        .history-card { }
        .history-title { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: #a1a1aa; text-transform: uppercase; margin-bottom: 14px; }
        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f7;
          font-size: 13px;
        }
        .history-item:last-child { border-bottom: none; }
        .history-date { color: #71717a; display: flex; align-items: center; gap: 6px; }
        .badge-granted {
          background: #f0fdf4;
          color: #15803d;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #bbf7d0;
        }
        .empty-history { font-size: 13px; color: #a1a1aa; text-align: center; padding: 20px 0; }
      `}</style>

      <div className="page">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-title">
            <span className="sidebar-icon">⚙️</span> Configurações
          </div>
          {[
            { icon: "▦", label: "Dashboard" },
            { icon: "○", label: "Perfil" },
            { icon: "◻", label: "Segurança" },
            { icon: "◯", label: "Notificações" },
            { icon: "▭", label: "Plano & Cobrança" },
            { icon: "🎁", label: "Indicações", active: true },
            { icon: "✉", label: "Suporte" },
          ].map(({ icon, label, active }) => (
            <div key={label} className={`nav-item${active ? " active" : ""}`}>
              <span>{icon}</span> {label}
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="content">
          <h1 className="page-title">🎁 Indicações</h1>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div>
                <div className="stat-label">Indicações confirmadas</div>
                <div className="stat-value">{mockData.confirmedReferrals}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div>
                <div className="stat-label">Próximo bônus</div>
                <div className="stat-value">{remaining}</div>
                <div className="stat-sub">restantes</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div>
                <div className="stat-label">Créditos ganhos</div>
                <div className="stat-value">{mockData.creditsEarned}</div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="card progress-card">
            <div className="progress-header">
              <span className="progress-label">{mockData.confirmedReferrals}/{mockData.nextBonusAt} indicações para o próximo bônus</span>
              <span className="progress-pct">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-hint">Faltam {remaining} indicações para ganhar +10 créditos.</p>
          </div>

          {/* Programa de indicações */}
          <div className="card">
            <div className="card-title">Como funciona</div>
            <div className="card-sub">Regras do programa de indicações</div>
            <div className="rules-grid">
              <div className={`rule-item ${firstConfirmed ? "done" : "active"}`}>
                <span className="rule-icon">{firstConfirmed ? "✅" : "🎁"}</span>
                <div style={{ flex: 1 }}>
                  <div className="rule-title">Na sua primeira indicação, todos ganham</div>
                  <div className="rule-desc">Você e o convidado recebem +5 créditos cada ao ativar um plano.</div>
                </div>
                {firstConfirmed && <span className="badge-done">Concluído</span>}
              </div>
              <div className="rule-item active">
                <span className="rule-icon">🏆</span>
                <div>
                  <div className="rule-title">A cada 10 indicações confirmadas</div>
                  <div className="rule-desc">Você ganha +10 créditos extras automaticamente.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Invite + Bonus unified */}
          <div className="card">
            <div className="card-title">Convide e ganhe</div>
            <div className="card-sub">Compartilhe seu link ou use seus bônus disponíveis</div>

            <div className="invite-section">
              <div className="invite-link-row">
                <div className="invite-link-input">{mockData.inviteLink}</div>
                <button className="btn-primary" onClick={handleCopy}>
                  {copied ? "✓ Copiado!" : "⎘ Copiar link"}
                </button>
              </div>
              <p className="hint-text">
                Quando seu convidado ativar um plano pago, vocês dois recebem <span>5 créditos bônus</span>.
              </p>
            </div>

            {mockData.bonusAvailable > 0 && (
              <>
                <hr className="divider" />
                {!bonusUsed ? (
                  <div className="bonus-row">
                    <div className="bonus-info">
                      <div className="bonus-label">🎁 Bônus de indicação disponível</div>
                      <div className="bonus-desc">Compartilhe um bônus — você e o amigo ganham +5 créditos grátis.</div>
                    </div>
                    <span className="bonus-count">{mockData.bonusAvailable} disponível</span>
                    <button className="btn-secondary" onClick={handleShareBonus}>
                      ↗ Compartilhar bônus
                    </button>
                  </div>
                ) : (
                  <p className="bonus-used-msg">Bônus utilizado. Continue indicando para ganhar mais!</p>
                )}
              </>
            )}
          </div>

          {/* History */}
          <div className="card history-card">
            <div className="history-title">Suas indicações</div>
            {mockData.history.length === 0 ? (
              <div className="empty-history">Nenhuma indicação ainda.</div>
            ) : (
              mockData.history.map((item, i) => (
                <div className="history-item" key={i}>
                  <span className="history-date">🕐 {item.date}</span>
                  <span className="badge-granted">{item.status}</span>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
