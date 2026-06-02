import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { LogOut } from 'lucide-react';
import { selectCurrentShift } from '../features/shifts/shiftsSlice';
import CloseShiftModal from './CloseShiftModal';

function useElapsed(openedAt) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    if (!openedAt) return;
    const calc = () => {
      const ms   = Date.now() - new Date(openedAt).getTime();
      const mins = Math.floor(ms / 60000);
      const h    = Math.floor(mins / 60);
      const m    = mins % 60;
      setElapsed(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [openedAt]);
  return elapsed;
}

export default function TopBar({ title, onSearch, searchValue, shift: shiftProp }) {
  const shiftFromRedux = useSelector(selectCurrentShift);
  const shift   = shiftProp ?? shiftFromRedux;
  const elapsed = useElapsed(shift?.openedAt);

  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [showClose, setShowClose] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">{title}</h1>
        </div>

        <div className="topbar-center">
          {onSearch !== undefined && (
            <div className="topbar-search">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search menu…"
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {shift && (
            <div className="topbar-shift-badge">
              <span className="topbar-shift-dot" />
              <span className="topbar-shift-cashier">{shift.cashier}</span>
              <span className="topbar-shift-sep">·</span>
              <span className="topbar-shift-elapsed">{elapsed}</span>
            </div>
          )}

          {shift && (
            <button
              className="topbar-close-shift-btn"
              onClick={() => setShowClose(true)}
              title="Close current shift"
            >
              <LogOut size={14} />
              <span>End Shift</span>
            </button>
          )}
        </div>

        <div className="topbar-right">
          <div className="topbar-datetime">
            <span className="topbar-time">{time}</span>
            <span className="topbar-date">{date}</span>
          </div>
          <button className="topbar-notif">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="notif-dot" />
          </button>
        </div>
      </header>

      {showClose && <CloseShiftModal onCancel={() => setShowClose(false)} />}
    </>
  );
}
