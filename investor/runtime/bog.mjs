// BOG-only comparison controls. The SVG and full score table also work without JS.
const figure = document.querySelector('[data-bog-radar]');
if (figure) {
  const controls = figure.querySelector('.bog-radar-controls');
  const buttons = [...controls.querySelectorAll('button')];
  const profiles = figure.querySelectorAll('[data-radar-series]');
  const select = button => {
    const selected = button.dataset.radarSelect;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    profiles.forEach(profile => {
      profile.style.display = selected === 'all' || profile.dataset.radarSeries === '4' || profile.dataset.radarSeries === selected ? '' : 'none';
    });
    figure.querySelectorAll('[data-radar-title]').forEach(title => { title.textContent = `BOG compared with ${button.dataset.radarName}`; });
    figure.querySelector('[data-radar-status]').textContent = `Showing BOG and ${button.dataset.radarName}.`;
    figure.querySelectorAll('[data-radar-axis-values]').forEach(row => {
      row.querySelectorAll('[data-series-value]').forEach(value => {
        value.hidden = selected !== 'all' && value.dataset.seriesValue !== '4' && value.dataset.seriesValue !== selected;
      });
    });
  };
  buttons.forEach(button => button.addEventListener('click', () => select(button)));
  controls.hidden = false;
}
