import { useLayoutEffect, useRef, useState } from 'react';
import { toDateKey, daysInMonth, formatMonthLabel } from '../../lib/dateUtils.js';
import './MonthGrid.css';

function SingleMonth({ year, month, loggedDates, onToggleDate }) {
  const logged = new Set(loggedDates);
  const today = new Date();
  const total = daysInMonth(year, month);
  const cells = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="month-grid-block">
      <div className="text-muted month-grid-label">{formatMonthLabel(new Date(year, month, 1))}</div>
      <div className="month-grid">
        {cells.map((dayNum) => {
          const d = new Date(year, month, dayNum);
          const key = toDateKey(d);
          const done = logged.has(key);
          const isFuture = d > today;
          return (
            <button
              key={dayNum}
              type="button"
              className={`month-cell${done ? ' done' : ''}${isFuture ? ' future' : ''}`}
              title={key}
              disabled={isFuture}
              onClick={() => onToggleDate(key, done)}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Horizontally scrollable timeline: oldest month on the left, current month
// on the right. Opens scrolled to the right (current month). loggedDates
// already holds the habit's full history, so scrolling back needs no extra
// fetching -- "Load more" just renders more months into the strip.
export default function MonthGrid({ loggedDates, onToggleDate }) {
  const [monthsBack, setMonthsBack] = useState(3);
  const scrollRef = useRef(null);
  const prevScrollWidthRef = useRef(0);
  const today = new Date();

  // oldest -> newest, so the current month lands at the right edge.
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const offset = monthsBack - 1 - i;
    const d = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const applyScroll = () => {
      if (prevScrollWidthRef.current) {
        // Months were prepended on the left; shift right by the added
        // width so the months already on screen stay put instead of
        // jumping.
        el.scrollLeft += el.scrollWidth - prevScrollWidthRef.current;
      } else {
        el.scrollLeft = el.scrollWidth;
      }
      prevScrollWidthRef.current = el.scrollWidth;
    };

    // Run once now, then again after the next paint in case layout
    // (e.g. web font swap) wasn't fully settled on the first pass.
    applyScroll();
    const raf = requestAnimationFrame(applyScroll);
    return () => cancelAnimationFrame(raf);
  }, [monthsBack]);

  return (
    <div className={monthsBack > 3 ? 'month-grid-scroll scrollable' : 'month-grid-scroll'} ref={scrollRef}>
      <button type="button" className="month-grid-more" onClick={() => setMonthsBack((n) => n + 3)}>
        ‹ Load more
      </button>
      {months.map(({ year, month }) => (
        <SingleMonth
          key={`${year}-${month}`}
          year={year}
          month={month}
          loggedDates={loggedDates}
          onToggleDate={onToggleDate}
        />
      ))}
    </div>
  );
}
