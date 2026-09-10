(() => {
  const ACCESS_CODE = 'DecibelStream2026!';
  const SESSION_KEY = 'decibel-stream-access';
  const form = document.getElementById('stream-password-form');
  const input = document.getElementById('stream-password');
  const error = document.getElementById('stream-password-error');
  const lock = document.getElementById('stream-lock');
  const content = document.getElementById('stream-content');
  const card = document.querySelector('.stream-card');
  const placeholder = document.getElementById('stream-player-placeholder');

  const loadPlayer = () => {
    if (placeholder.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = 'https://player.twitch.tv/?channel=decibelsound&parent=decibelsound.nl&parent=www.decibelsound.nl&autoplay=false&muted=false';
    iframe.title = 'Decibel livestream via Twitch';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allow', 'autoplay; fullscreen');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    placeholder.replaceChildren(iframe);
  };

  const unlock = () => {
    lock.hidden = true;
    content.hidden = false;
    card.classList.add('is-unlocked');
    sessionStorage.setItem(SESSION_KEY, '1');
    loadPlayer();
  };

  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    unlock();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (input.value === ACCESS_CODE) {
      error.textContent = '';
      unlock();
      return;
    }
    error.textContent = 'Onjuiste toegangscode. Controleer de code en probeer opnieuw.';
    input.select();
  });
})();
