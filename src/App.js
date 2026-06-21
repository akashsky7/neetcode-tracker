import { useState, useEffect, useCallback } from 'react';
import { WEEKS, AH_QS, START_DATE } from './data';
import './App.css';

const STORAGE_KEY = 'akash_nc_v1';

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function dayName(d) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}
function isToday(d) {
  const t = new Date();
  return d.toDateString() === t.toDateString();
}
function currentWeekIdx() {
  const diff = Math.floor((new Date() - START_DATE) / (1000 * 60 * 60 * 24 * 7));
  return Math.min(Math.max(diff + 1, 1), WEEKS.length - 1);
}
function getAllKeys() {
  const keys = [];
  WEEKS.forEach((w, wi) => {
    if (w.done) return;
    w.days.forEach((d, di) => {
      (d.qs || []).forEach((_, qi) => keys.push(`${wi}_${di}_${qi}`));
    });
  });
  return keys;
}

export default function App() {
  const [checked, setChecked] = useState({});
  const [activeW, setActiveW] = useState(currentWeekIdx());
  const [saved, setSaved] = useState(false);
  const [saveTimer, setSaveTimer] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setChecked(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persist = useCallback((next) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
    setSaved(true);
    clearTimeout(saveTimer);
    const t = setTimeout(() => setSaved(false), 1800);
    setSaveTimer(t);
  }, [saveTimer]);

  const toggle = useCallback((key) => {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      persist(next);
      return next;
    });
  }, [persist]);

  const allKeys = getAllKeys();
  const preCompleted = AH_QS.length;
  const trackedDone = allKeys.filter(k => checked[k]).length;
  const total = preCompleted + allKeys.length;
  const done = preCompleted + trackedDone;
  const pct = Math.round((done / total) * 100);
  const dayNum = Math.min(Math.floor((new Date() - START_DATE) / (1000 * 60 * 60 * 24)) + 1, 63);

  const w = WEEKS[activeW];

  return (
    <div className="app">
      <div className="header">
        <div className="header-top">
          <div>
            <h1>NeetCode BFSI Tracker</h1>
            <p>Akash · Jun 21 → Aug 22, 2026 · JPMorgan / BNY Mellon prep</p>
          </div>
          <div className="day-pill">Day {dayNum}/63</div>
        </div>
      </div>

      <div className="stats">
        {[
          { n: done, l: 'Solved', green: true },
          { n: total, l: 'Total' },
          { n: `Wk ${currentWeekIdx() + 1}`, l: 'Current week' },
          { n: `${pct}%`, l: 'Complete' },
        ].map((s, i) => (
          <div className="stat" key={i}>
            <div className={`stat-n${s.green ? ' green' : ''}`}>{s.n}</div>
            <div className="stat-l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="progress-wrap">
        <div className="progress-row">
          <span>Overall progress</span>
          <span>{done} / {total} questions</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="streak">
        <span>🔥</span>
        Consistency beats intensity — keep showing up daily
      </div>

      <div className="week-tabs">
        {WEEKS.map((wk, i) => (
          <button
            key={i}
            className={`wtab${i === activeW ? ' active' : ''}${(wk.done || i < activeW) ? ' older' : ''}`}
            onClick={() => setActiveW(i)}
          >
            Wk {i + 1}{(wk.done || (i < currentWeekIdx() && i < activeW)) ? ' ✓' : ''}
          </button>
        ))}
      </div>

      <div className="week-content">
        {w.done ? (
          <>
            <div className="week-info">
              <h2>{w.title}</h2>
              <p>{w.focus}</p>
            </div>
            <div className="completed-banner">✓ Completed last week — all {AH_QS.length} questions done. Great start!</div>
            <div className="day-card">
              <div className="day-head">
                <span className="day-lbl">Questions completed</span>
              </div>
              {AH_QS.map((q, i) => (
                <div className="q-item no-click" key={i}>
                  <div className="q-check on" />
                  <span className="q-name struck">{q.n}</span>
                  <span className={`diff diff-${q.d}`}>{q.d}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="week-info">
              <h2>{w.title}</h2>
              <p>{w.focus}</p>
            </div>
            {w.days.map((day, di) => {
              const date = addDays(START_DATE, day.off);
              const tod = isToday(date);
              const qs = day.qs || [];
              const badgeCls = tod ? 'badge-today' : day.type === 'buffer' ? 'badge-buffer' : day.type === 'revision' ? 'badge-revision' : 'badge-active';
              const badgeTxt = tod ? 'today' : day.type === 'buffer' ? 'buffer' : day.type === 'revision' ? 'revision' : 'active';
              return (
                <div className={`day-card${tod ? ' today-card' : ''}`} key={di}>
                  <div className={`day-head${tod ? ' today-head' : ''}`}>
                    <span className="day-lbl">{day.lbl}{day.rev ? ' — revision' : ''}</span>
                    <span className="day-dt">{dayName(date)}, {fmtDate(date)}</span>
                    <span className={`badge ${badgeCls}`}>{badgeTxt}</span>
                  </div>
                  {day.note && <div className="note">{day.note}</div>}
                  {qs.map((q, qi) => {
                    const key = `${activeW}_${di}_${qi}`;
                    const on = !!checked[key];
                    return (
                      <div className="q-item" key={qi} onClick={() => toggle(key)}>
                        <div className={`q-check${on ? ' on' : ''}`} />
                        <span className={`q-name${on ? ' struck' : ''}`}>{q.n}</span>
                        <span className={`diff diff-${q.d}`}>{q.d}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className={`save-toast${saved ? ' show' : ''}`}>✓ Saved</div>
    </div>
  );
}
