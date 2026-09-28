// Props that make a non-button element (a row, a card) behave like a
// button for keyboard and screen-reader users: focusable with Tab,
// announced as a button, activated by Enter or Space. Use it where the
// clickable thing is a layout container that can't be a real <button>
// (e.g. it holds block elements). Keys pressed inside nested controls are
// ignored, so a real button inside the row still works on its own.
export function pressable(onActivate) {
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      }
    },
  };
}
