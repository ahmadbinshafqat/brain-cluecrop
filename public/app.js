const state = {
  sets: [],
  currentSet: null,
  filters: {
    q: '',
    sort: 'recent',
    minCards: '',
  },
};

const els = {
  sourceText: document.querySelector('#sourceText'),
  titleInput: document.querySelector('#titleInput'),
  generateBtn: document.querySelector('#generateBtn'),
  saveBtn: document.querySelector('#saveBtn'),
  deleteBtn: document.querySelector('#deleteBtn'),
  setsList: document.querySelector('#setsList'),
  cardsEditor: document.querySelector('#cardsEditor'),
  currentTitle: document.querySelector('#currentTitle'),
  currentMeta: document.querySelector('#currentMeta'),
  status: document.querySelector('#status'),
  setSearch: document.querySelector('#setSearch'),
  setSort: document.querySelector('#setSort'),
  minCards: document.querySelector('#minCards'),
  clearSetFilters: document.querySelector('#clearSetFilters'),
  setResultsMeta: document.querySelector('#setResultsMeta'),
};

function setStatus(message, kind = 'info') {
  els.status.textContent = message;
  els.status.className = `status ${kind}`;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with ${res.status}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

function buildListQuery() {
  const params = new URLSearchParams();
  const q = state.filters.q.trim();
  const minCards = String(state.filters.minCards || '').trim();

  if (q) params.set('q', q);
  if (state.filters.sort && state.filters.sort !== 'recent') params.set('sort', state.filters.sort);
  if (minCards) params.set('minCards', minCards);

  const query = params.toString();
  return query ? `?${query}` : '';
}

async function loadSets() {
  state.sets = await api(`/api/flashcard-sets${buildListQuery()}`);
  renderSets();
}

async function loadSet(id) {
  state.currentSet = await api(`/api/flashcard-sets/${id}`);
  renderCurrentSet();
  renderSets();
}

function renderSets() {
  els.setsList.innerHTML = '';

  const hasFilters = Boolean(state.filters.q.trim() || state.filters.minCards);
  const total = state.sets.length;
  els.setResultsMeta.textContent = hasFilters
    ? `${total} matching set${total === 1 ? '' : 's'}`
    : `${total} saved set${total === 1 ? '' : 's'}`;

  if (!state.sets.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-list';
    empty.textContent = hasFilters
      ? 'No sets match your search or filters.'
      : 'No saved sets yet. Generate your first set.';
    els.setsList.appendChild(empty);
    return;
  }

  for (const set of state.sets) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'set-item';
    if (state.currentSet && state.currentSet.id === set.id) {
      button.classList.add('active');
    }
    button.type = 'button';
    button.addEventListener('click', () => loadSet(set.id).catch(showError));

    const title = document.createElement('span');
    title.className = 'set-title';
    title.textContent = set.title || 'Untitled set';

    const meta = document.createElement('span');
    meta.className = 'set-meta';
    const updated = set.updatedAt ? new Date(set.updatedAt).toLocaleDateString() : '';
    meta.textContent = `${set.cardCount || 0} cards${updated ? ` · ${updated}` : ''}`;

    button.append(title, meta);
    li.appendChild(button);
    els.setsList.appendChild(li);
  }
}

function renderCurrentSet() {
  const set = state.currentSet;
  els.cardsEditor.innerHTML = '';

  if (!set) {
    els.currentTitle.value = '';
    els.currentMeta.textContent = 'Generate or select a saved set to begin editing.';
    els.saveBtn.disabled = true;
    els.deleteBtn.disabled = true;
    return;
  }

  els.currentTitle.value = set.title || '';
  els.currentMeta.textContent = `${set.flashcards?.length || 0} cards generated from ${set.chunks?.length || 0} source chunks`;
  els.saveBtn.disabled = false;
  els.deleteBtn.disabled = false;

  for (const [index, card] of (set.flashcards || []).entries()) {
    const row = document.createElement('section');
    row.className = 'card-editor';
    row.dataset.index = String(index);

    const label = document.createElement('div');
    label.className = 'card-number';
    label.textContent = `Card ${index + 1}`;

    const qLabel = document.createElement('label');
    qLabel.textContent = 'Question';
    const question = document.createElement('textarea');
    question.className = 'question-input';
    question.value = card.question || '';

    const aLabel = document.createElement('label');
    aLabel.textContent = 'Answer';
    const answer = document.createElement('textarea');
    answer.className = 'answer-input';
    answer.value = card.answer || '';

    row.append(label, qLabel, question, aLabel, answer);
    els.cardsEditor.appendChild(row);
  }
}

async function generateSet() {
  const sourceText = els.sourceText.value.trim();
  const title = els.titleInput.value.trim();

  if (!sourceText) {
    setStatus('Paste source text before generating flashcards.', 'error');
    return;
  }

  els.generateBtn.disabled = true;
  setStatus('Generating flashcards locally...');

  try {
    state.currentSet = await api('/api/flashcard-sets/generate', {
      method: 'POST',
      body: JSON.stringify({ sourceText, title }),
    });
    els.titleInput.value = '';
    renderCurrentSet();
    await loadSets();
    setStatus('Flashcards generated and saved.', 'success');
  } catch (err) {
    showError(err);
  } finally {
    els.generateBtn.disabled = false;
  }
}

async function saveSet() {
  if (!state.currentSet) return;

  const flashcards = [...els.cardsEditor.querySelectorAll('.card-editor')].map((row) => ({
    question: row.querySelector('.question-input').value.trim(),
    answer: row.querySelector('.answer-input').value.trim(),
  }));

  els.saveBtn.disabled = true;
  setStatus('Saving edits...');

  try {
    state.currentSet = await api(`/api/flashcard-sets/${state.currentSet.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: els.currentTitle.value.trim(), flashcards }),
    });
    renderCurrentSet();
    await loadSets();
    setStatus('Edits saved.', 'success');
  } catch (err) {
    showError(err);
  } finally {
    els.saveBtn.disabled = false;
  }
}

async function deleteSet() {
  if (!state.currentSet) return;
  if (!confirm(`Delete "${state.currentSet.title}"?`)) return;

  const id = state.currentSet.id;
  setStatus('Deleting set...');

  try {
    await api(`/api/flashcard-sets/${id}`, { method: 'DELETE' });
    state.currentSet = null;
    renderCurrentSet();
    await loadSets();
    setStatus('Set deleted.', 'success');
  } catch (err) {
    showError(err);
  }
}

function updateFiltersFromControls() {
  state.filters.q = els.setSearch.value;
  state.filters.sort = els.setSort.value;
  state.filters.minCards = els.minCards.value;
}

function clearFilters() {
  els.setSearch.value = '';
  els.setSort.value = 'recent';
  els.minCards.value = '';
  updateFiltersFromControls();
  loadSets().catch(showError);
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showError(err) {
  console.error(err);
  setStatus(err.message || 'Something went wrong.', 'error');
}

els.generateBtn.addEventListener('click', generateSet);
els.saveBtn.addEventListener('click', saveSet);
els.deleteBtn.addEventListener('click', deleteSet);
els.clearSetFilters.addEventListener('click', clearFilters);

const onFilterChange = debounce(() => {
  updateFiltersFromControls();
  loadSets().catch(showError);
});

els.setSearch.addEventListener('input', onFilterChange);
els.minCards.addEventListener('input', onFilterChange);
els.setSort.addEventListener('change', () => {
  updateFiltersFromControls();
  loadSets().catch(showError);
});

renderCurrentSet();
loadSets().catch(showError);
