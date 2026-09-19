// Adapter only. A click is never a completed booking.
export function track(event, detail = {}) {
  const payload = { event, ...detail, page: location.pathname };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  window.dispatchEvent(new CustomEvent('thrylox:analytics', { detail: payload }));
}
export function initAnalytics() {
  document.addEventListener('click', event => {
    const booking = event.target.closest('[data-booking]');
    if (booking) track('booking_cta_click', { placement: booking.dataset.booking });
    const open = event.target.closest('[data-deep-open]');
    if (open) track('deep_dive_open', { story: open.dataset.deepOpen });
    const back = event.target.closest('[data-deep-return]');
    if (back) track('deep_dive_return', { story: back.dataset.deepReturn, kind: back.dataset.returnKind });
  });
}
