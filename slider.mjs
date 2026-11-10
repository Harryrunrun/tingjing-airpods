const clamp = value => Math.max(0, Math.min(2, Number(value) || 0));

// Keep continuous pointer position separate from the last committed mode.
export function createSnapSlider(input, channel, onCommit) {
  const thumb = channel.querySelector('.slider-thumb');
  let committed = Math.round(clamp(input.value));
  let position = committed;
  let gesture = null;

  function draw(value) {
    position = clamp(value);
    input.value = String(position);
    channel.style.setProperty('--slider-position', String(position / 2));
  }

  function bounds() {
    const rect = input.getBoundingClientRect();
    const radius = thumb.offsetWidth / 2;
    return { left: rect.left + radius, travel: Math.max(1, rect.width - radius * 2) };
  }

  function atPointer(clientX, offset = 0) {
    const track = bounds();
    return clamp((clientX - offset - track.left) / track.travel * 2);
  }

  function endGesture() {
    const previous = gesture;
    gesture = null;
    channel.classList.remove('is-dragging');
    input.step = '1';
    if (previous && input.hasPointerCapture(previous.id)) input.releasePointerCapture(previous.id);
  }

  function select(value) {
    endGesture();
    committed = Math.round(clamp(value));
    draw(committed);
  }

  function cancel() {
    if (!gesture) return;
    select(committed);
  }

  input.addEventListener('pointerdown', event => {
    if (gesture || event.isPrimary === false || event.button !== 0) return;
    event.preventDefault();
    const rect = thumb.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    // Preserve the finger's grip position, including a grab during snap animation.
    const offset = Math.abs(event.clientX - center) <= rect.width / 2 + 6 ? event.clientX - center : 0;
    gesture = { id: event.pointerId, offset };
    input.step = 'any';
    channel.classList.add('is-dragging');
    input.focus({ preventScroll: true });
    input.setPointerCapture(event.pointerId);
    draw(atPointer(event.clientX, offset));
  });

  input.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    event.preventDefault();
    draw(atPointer(event.clientX, gesture.offset));
  });

  input.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    event.preventDefault();
    const target = Math.round(atPointer(event.clientX, gesture.offset));
    select(target);
    // Stay in the trusted release event so iOS can open the shortcut.
    onCommit(target);
  });

  input.addEventListener('pointercancel', cancel);
  input.addEventListener('lostpointercapture', cancel);
  input.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel();
  });

  input.addEventListener('keydown', event => {
    const delta = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : delta === undefined ? null : clamp(committed + delta);
    if (target === null) return;
    event.preventDefault();
    if (target === committed) return;
    select(target);
    onCommit(target);
  });

  // Native accessibility adjustments still use three discrete positions.
  input.addEventListener('input', () => {
    if (!gesture) draw(input.value);
  });
  input.addEventListener('change', () => {
    if (gesture) return;
    const target = Math.round(clamp(input.value));
    if (target === committed) return;
    select(target);
    onCommit(target);
  });

  input.step = '1';
  draw(committed);
  return { select };
}
