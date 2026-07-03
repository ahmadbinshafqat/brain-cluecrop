let currentSet = null;
const el = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

function setStatus(message) { el('status').textContent = message; }

async function loadSets() {
  const sets = await api('/api/flashcard-sets');
  el('sets').innerHTML = sets.map(s => `<button class="set-item" data-id="${s.id}"><strong>${escapeHtml(s.title)}</strong><small>${new Date(s.createdAt).toLocaleString()}</small></button>`).join('') || '<p class="muted">No saved sets yet.</p>';
  document.querySelectorAll('.set-item').forEach(btn => btn.onclick = () => loadSet(btn.dataset.id));
}

async function loadSet(id) {
  currentSet = await api(`/api/flashcard-sets/${id}`);
  el('title').value = currentSet.title;
  el('sourceText').value = currentSet.sourceText;
  renderCards(currentSet.flashcards || []);
  el('saveBtn').disabled = false;
}

function renderCards(cards) {
  const sorted = [...cards].sort((a, b) => a.order - b.order);
  el('cards').classList.remove('empty');
  el('cards').innerHTML = sorted.map((card, i) => `
    <article class="card" data-id="${card.id || ''}" data-score="${card.score || 0}">
      <div class="rank">#${i + 1} <span>score ${Number(card.score || 0).toFixed(2)}</span></div>
      <label>Question<textarea class="question">${escapeHtml(card.question)}</textarea></label>
      <label>Answer<textarea class="answer">${escapeHtml(card.answer)}</textarea></label>
    </article>`).join('');
}

async function generate() {
  const sourceText = el('sourceText').value.trim();
  if (sourceText.length < 40) return setStatus('Paste at least 40 characters.');
  setStatus('Generating...');
  el('generateBtn').disabled = true;
  try {
    currentSet = await api('/api/flashcard-sets/generate', { method: 'POST', body: JSON.stringify({ sourceText, title: el('title').value.trim() || undefined }) });
    el('title').value = currentSet.title;
    renderCards(currentSet.flashcards || []);
    el('saveBtn').disabled = false;
    await loadSets();
    setStatus('Generated and saved. Edit cards below.');
  } catch (e) {
    setStatus('Error: ' + e.message);
  } finally {
    el('generateBtn').disabled = false;
  }
}

async function saveEdits() {
  if (!currentSet) return;
  const flashcards = [...document.querySelectorAll('.card')].map((node, index) => ({
    id: Number(node.dataset.id) || undefined,
    question: node.querySelector('.question').value.trim(),
    answer: node.querySelector('.answer').value.trim(),
    score: Number(node.dataset.score) || 0,
    order: index + 1,
  })).filter(c => c.question && c.answer);
  setStatus('Saving...');
  currentSet = await api(`/api/flashcard-sets/${currentSet.id}`, { method: 'PUT', body: JSON.stringify({ title: el('title').value.trim() || 'Untitled Study Set', flashcards }) });
  renderCards(currentSet.flashcards || []);
  await loadSets();
  setStatus('Saved edits.');
}

function reset() {
  currentSet = null;
  el('title').value = '';
  el('sourceText').value = '';
  el('cards').className = 'cards empty';
  el('cards').textContent = 'Generate a set to edit flashcards here.';
  el('saveBtn').disabled = true;
  setStatus('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

el('generateBtn').onclick = generate;
el('saveBtn').onclick = saveEdits;
el('newBtn').onclick = reset;
loadSets();
