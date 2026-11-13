/** A single, allocation-free pointer store shared by the WebGL scenes. */
export const pointer = { x: -9999, y: -9999, active: false, moved: 0 };

if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    event => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
      pointer.moved = performance.now();
    },
    { passive: true }
  );
  document.addEventListener('pointerleave', () => {
    pointer.active = false;
  });
}
