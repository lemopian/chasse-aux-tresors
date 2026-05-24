(() => {
  'use strict';

  const STORAGE = {
    team: 'ct:teamName',
    step: 'ct:stepIndex',
    hints: 'ct:hintsUsed',
    hintsPerStep: 'ct:hintsRevealed',
    start: 'ct:startTime',
  };

  const $ = (id) => document.getElementById(id);

  let data = null;

  function normalize(s) {
    return s
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0153/g, 'oe')
      .replace(/\u00e6/g, 'ae')
      .replace(/[-_'\u2019]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function sha256(str) {
    const buf = new TextEncoder().encode(str);
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }

  function loadHintsRevealed() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE.hintsPerStep) || '{}');
    } catch {
      return {};
    }
  }

  function saveHintsRevealed(obj) {
    localStorage.setItem(STORAGE.hintsPerStep, JSON.stringify(obj));
  }

  function getState() {
    return {
      team: localStorage.getItem(STORAGE.team) || '',
      step: parseInt(localStorage.getItem(STORAGE.step) || '0', 10),
      hints: parseInt(localStorage.getItem(STORAGE.hints) || '0', 10),
      start: parseInt(localStorage.getItem(STORAGE.start) || '0', 10),
      hintsRevealed: loadHintsRevealed(),
    };
  }

  function setState(patch) {
    if (patch.team !== undefined) localStorage.setItem(STORAGE.team, patch.team);
    if (patch.step !== undefined) localStorage.setItem(STORAGE.step, String(patch.step));
    if (patch.hints !== undefined) localStorage.setItem(STORAGE.hints, String(patch.hints));
    if (patch.start !== undefined) localStorage.setItem(STORAGE.start, String(patch.start));
    if (patch.hintsRevealed !== undefined) saveHintsRevealed(patch.hintsRevealed);
  }

  function clearState() {
    Object.values(STORAGE).forEach((k) => localStorage.removeItem(k));
  }

  function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
    return `${m}min${String(s).padStart(2, '0')}`;
  }

  function renderHome() {
    showScreen('screen-home');
    const state = getState();
    if (state.team && state.step > 0 && state.step <= data.enigmes.length) {
      $('resume-hint').classList.remove('hidden');
      $('resume-link').onclick = (e) => {
        e.preventDefault();
        renderStep();
      };
    }
    $('team-name').value = state.team || '';
    $('start-btn').onclick = onStart;
  }

  function onStart() {
    const name = $('team-name').value.trim() || 'Équipe sans nom';
    setState({
      team: name,
      step: 0,
      hints: 0,
      start: Date.now(),
      hintsRevealed: {},
    });
    renderStep();
  }

  function renderStep() {
    const state = getState();
    const idx = state.step;
    if (idx >= data.enigmes.length) {
      renderFinal();
      return;
    }
    showScreen('screen-step');
    const lieu = data.lieux[idx];
    const enigme = data.enigmes[idx];
    $('step-badge').textContent = `Étape ${idx + 1} / ${data.lieux.length}`;
    $('team-label').textContent = state.team;
    $('lieu-nom').textContent = lieu.nom;
    $('lieu-desc').textContent = lieu.description || '';
    $('enigme-texte').textContent = enigme.texte;
    if (enigme.direction) {
      $('direction-box').style.display = '';
      $('direction-texte').textContent = enigme.direction;
    } else {
      $('direction-box').style.display = 'none';
    }
    $('answer-input').value = '';
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('answer-input').focus();

    // Hints
    const revealed = state.hintsRevealed[String(idx)] || 0;
    $('hints-count').textContent = String(state.hints);
    renderHints(idx, enigme.indices || [], revealed);

    $('answer-form').onsubmit = (e) => {
      e.preventDefault();
      onSubmitAnswer();
    };
    $('restart-link').onclick = (e) => {
      e.preventDefault();
      if (confirm('Recommencer depuis le début ? Le chrono et les progrès seront perdus.')) {
        clearState();
        renderHome();
      }
    };
  }

  function renderHints(stepIdx, hints, revealedCount) {
    const list = $('hints-list');
    list.innerHTML = '';
    for (let i = 0; i < revealedCount && i < hints.length; i++) {
      const div = document.createElement('div');
      div.className = 'hint-item';
      div.textContent = `${i + 1}. ${hints[i]}`;
      list.appendChild(div);
    }
    const btn = $('reveal-hint-btn');
    if (revealedCount >= hints.length) {
      btn.disabled = true;
      btn.textContent = 'Plus d\'indice disponible';
    } else {
      btn.disabled = false;
      btn.textContent = revealedCount === 0 ? 'Révéler un indice' : 'Révéler un autre indice';
    }
    btn.onclick = () => {
      const state = getState();
      const cur = state.hintsRevealed[String(stepIdx)] || 0;
      if (cur >= hints.length) return;
      const next = cur + 1;
      const map = { ...state.hintsRevealed, [String(stepIdx)]: next };
      setState({ hints: state.hints + 1, hintsRevealed: map });
      renderStep();
      // Re-open the hints details after re-render
      document.querySelector('.hints').open = true;
    };
  }

  async function onSubmitAnswer() {
    const state = getState();
    const idx = state.step;
    const raw = $('answer-input').value;
    if (!raw.trim()) return;
    const guessHash = await sha256(normalize(raw));
    const expected = data.enigmes[idx].reponseHash;
    const fb = $('feedback');
    const card = document.querySelector('#screen-step .card');
    if (guessHash === expected) {
      fb.textContent = '✓ Bonne réponse !';
      fb.className = 'feedback ok';
      card.classList.add('celebrate');
      setTimeout(() => {
        setState({ step: idx + 1 });
        card.classList.remove('celebrate');
        if (idx + 1 >= data.enigmes.length) {
          renderFinal();
        } else {
          renderStep();
        }
      }, 900);
    } else {
      fb.textContent = '✗ Pas tout à fait… réessaie !';
      fb.className = 'feedback ko';
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 450);
    }
  }

  function renderFinal() {
    showScreen('screen-final');
    const state = getState();
    const elapsed = state.start ? Date.now() - state.start : 0;
    $('final-titre').textContent = data.final.titre || 'Bravo !';
    $('final-team').textContent = state.team || '';
    $('final-message').textContent = data.final.message || '';
    $('stat-time').textContent = formatDuration(elapsed);
    $('stat-hints').textContent = String(state.hints);
    $('restart-btn').onclick = () => {
      if (confirm('Recommencer une nouvelle partie ?')) {
        clearState();
        renderHome();
      }
    };
  }

  async function init() {
    try {
      const resp = await fetch('etapes.json', { cache: 'no-store' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      data = await resp.json();
    } catch (err) {
      document.body.innerHTML =
        '<main style="max-width:520px;margin:40px auto;padding:24px;font-family:system-ui;">' +
        '<h1>Oups…</h1><p>Impossible de charger <code>etapes.json</code>.</p>' +
        '<p><strong>Astuce</strong> : ouvre cette page via un serveur local <br/>(<code>python3 -m http.server</code>) ou sur GitHub Pages.</p>' +
        '<pre style="background:#fee;padding:12px;border-radius:8px;overflow:auto;">' +
        String(err) + '</pre></main>';
      return;
    }

    const state = getState();
    if (state.team && state.step >= data.enigmes.length) {
      renderFinal();
    } else if (state.team && state.start) {
      renderStep();
    } else {
      renderHome();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
