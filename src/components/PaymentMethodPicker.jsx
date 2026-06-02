import { useEffect } from 'react';
import { useGetPaymentMethodsQuery } from '../store/apis/paymentMethodsApi';

// ─── Brand SVG icons ─────────────────────────────────────────────

function CashIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="32" height="20" rx="3" fill="#16a34a" opacity=".15"/>
      <rect x="4" y="10" width="32" height="20" rx="3" stroke="#16a34a" strokeWidth="1.8"/>
      <circle cx="20" cy="20" r="5" stroke="#16a34a" strokeWidth="1.8"/>
      <path d="M4 15h5M31 15h5M4 25h5M31 25h5" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round"/>
      <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="700" fill="#16a34a">$</text>
    </svg>
  );
}

function KHQRIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5"  y="5"  width="12" height="12" rx="2" fill="#991b1b" opacity=".12"/>
      <rect x="5"  y="5"  width="12" height="12" rx="2" stroke="#991b1b" strokeWidth="1.6"/>
      <rect x="8"  y="8"  width="6"  height="6"  rx="1" fill="#991b1b"/>
      <rect x="23" y="5"  width="12" height="12" rx="2" fill="#991b1b" opacity=".12"/>
      <rect x="23" y="5"  width="12" height="12" rx="2" stroke="#991b1b" strokeWidth="1.6"/>
      <rect x="26" y="8"  width="6"  height="6"  rx="1" fill="#991b1b"/>
      <rect x="5"  y="23" width="12" height="12" rx="2" fill="#991b1b" opacity=".12"/>
      <rect x="5"  y="23" width="12" height="12" rx="2" stroke="#991b1b" strokeWidth="1.6"/>
      <rect x="8"  y="26" width="6"  height="6"  rx="1" fill="#991b1b"/>
      <rect x="23" y="23" width="4" height="4" rx="1" fill="#991b1b"/>
      <rect x="29" y="23" width="4" height="4" rx="1" fill="#991b1b"/>
      <rect x="23" y="29" width="4" height="4" rx="1" fill="#991b1b"/>
      <rect x="29" y="29" width="4" height="4" rx="1" fill="#991b1b"/>
      <rect x="26" y="26" width="4" height="4" rx="1" fill="#991b1b" opacity=".4"/>
    </svg>
  );
}

function FoodPandaIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="6" fill="#FF2B85"/>
      <circle cx="29" cy="11" r="6" fill="#FF2B85"/>
      <circle cx="11" cy="11" r="3.5" fill="#fff"/>
      <circle cx="29" cy="11" r="3.5" fill="#fff"/>
      <circle cx="20" cy="22" r="13" fill="#fff" stroke="#FF2B85" strokeWidth="1.5"/>
      <ellipse cx="14.5" cy="19.5" rx="4.5" ry="5" fill="#2d2d2d"/>
      <ellipse cx="25.5" cy="19.5" rx="4.5" ry="5" fill="#2d2d2d"/>
      <circle cx="14.5" cy="19.5" r="2" fill="#fff"/>
      <circle cx="25.5" cy="19.5" r="2" fill="#fff"/>
      <circle cx="15" cy="19" r="1" fill="#2d2d2d"/>
      <circle cx="26" cy="19" r="1" fill="#2d2d2d"/>
      <ellipse cx="20" cy="26" rx="3" ry="2" fill="#FF2B85" opacity=".7"/>
      <path d="M17 26.5 Q20 29 23 26.5" stroke="#FF2B85" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function EgetsIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#f97316"/>
      <text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily="system-ui, sans-serif">E</text>
    </svg>
  );
}

function GrabIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#00b14f"/>
      <path d="M26 16a8 8 0 1 0 0 8h-5v-4h9v6a9 9 0 1 1 0-14v4z" fill="#fff" transform="translate(1,1) scale(0.92)"/>
      <rect x="22" y="20" width="6" height="3.5" rx="1" fill="#fff"/>
      <path d="M13 20a7 7 0 1 1 9 6.7V23h-3v5h6a10 10 0 1 0-12-8z" fill="#fff"/>
    </svg>
  );
}

function WowNowIcon() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="32" height="32" rx="8" fill="#7c3aed"/>
      <rect x="9" y="9" width="22" height="15" rx="4" fill="#fff" opacity=".2"/>
      <rect x="9" y="9" width="22" height="15" rx="4" stroke="#fff" strokeWidth="1.5"/>
      <path d="M13 24l2 4 3-4" fill="#fff"/>
      <text x="20" y="21" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">WN</text>
    </svg>
  );
}

function GenericCardIcon({ color = '#52525b' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="32" height="20" rx="3" fill={color} opacity=".12"/>
      <rect x="4" y="10" width="32" height="20" rx="3" stroke={color} strokeWidth="1.8"/>
      <rect x="4" y="16" width="32" height="6" fill={color} opacity=".2"/>
      <rect x="8" y="23" width="8" height="3" rx="1" fill={color} opacity=".5"/>
    </svg>
  );
}

// ─── Code → icon / color / backend type ──────────────────────────

export function getMethodMeta(code = '') {
  const c = (code ?? '').toLowerCase().replace(/[_\s-]/g, '');
  if (c === 'cash')                               return { icon: <CashIcon />,       color: '#16a34a', backendType: 'cash', isCash: true  };
  if (c.includes('khqr') || c === 'qr')          return { icon: <KHQRIcon />,       color: '#991b1b', backendType: 'qr',   isCash: false };
  if (c.includes('foodpanda') || c === 'panda')  return { icon: <FoodPandaIcon />,  color: '#FF2B85', backendType: 'card', isCash: false };
  if (c.includes('eget'))                        return { icon: <EgetsIcon />,      color: '#f97316', backendType: 'card', isCash: false };
  if (c === 'grab')                              return { icon: <GrabIcon />,       color: '#00b14f', backendType: 'card', isCash: false };
  if (c.includes('wow') || c.includes('wownow')) return { icon: <WowNowIcon />,     color: '#7c3aed', backendType: 'card', isCash: false };
  // Fallback: generic card icon using a deterministic colour from the code
  const COLORS = ['#2563eb','#0891b2','#7c3aed','#db2777','#d97706'];
  const colour  = COLORS[c.charCodeAt(0) % COLORS.length];
  return { icon: <GenericCardIcon color={colour} />, color: colour, backendType: 'card', isCash: false };
}

// ─── Picker component ─────────────────────────────────────────────

export default function PaymentMethodPicker({ selected, onChange }) {
  const { data: methods = [], isLoading } = useGetPaymentMethodsQuery(
    { activeOnly: true },
    { refetchOnMountOrArgChange: true },
  );

  // Auto-select first method when methods load and nothing is selected yet
  useEffect(() => {
    if (methods.length > 0 && !selected) {
      const first = methods[0];
      onChange(first.code, first.name);
    }
  }, [methods, selected, onChange]);

  if (isLoading) {
    return (
      <div className="pmp-wrap">
        <div className="pmp-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pmp-card" style={{ opacity: .4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--grey-200)' }} />
              <span className="pmp-label" style={{ background: 'var(--grey-200)', color: 'transparent', borderRadius: 3 }}>——</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="pmp-wrap" style={{ padding: '10px 14px', color: 'var(--text-lt)', fontSize: 12 }}>
        No active payment methods configured.
      </div>
    );
  }

  return (
    <div className="pmp-wrap">
      <div className="pmp-grid">
        {methods.map((pm) => {
          const meta     = getMethodMeta(pm.code);
          const isActive = selected === pm.code;
          return (
            <button
              key={pm._id}
              className={`pmp-card ${isActive ? 'pmp-card--active' : ''}`}
              style={isActive ? { '--pmp-color': meta.color } : {}}
              onClick={() => onChange(pm.code, pm.name)}
              title={pm.description || pm.name}
            >
              <div className="pmp-icon">{meta.icon}</div>
              <span className="pmp-label">{pm.name}</span>
              {isActive && (
                <span className="pmp-check">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
