const mockData = {
  meta: {
    mode: 'demo',
    source: 'static-json-fallback',
    privacy: 'safe-summary',
    generatedAt: Date.now(),
    reason: 'Showing static fallback data.'
  },
  system: {
    agents: 3,
    activeAgents: 1,
    gateway: 'demo',
    defaultModel: 'gpt-5.4',
    channels: ['telegram x3'],
    totalTokens: 271561,
    recentSessions: 3,
    note: 'Fallback mock data'
  },
  recentSessions: [],
  agents: []
};

const agentGrid = document.getElementById('agentGrid');
const detail = document.getElementById('agentDetail');
const systemOverview = document.getElementById('systemOverview');
const refreshBtn = document.getElementById('refreshBtn');
const modeBanner = document.getElementById('modeBanner');
const usageSummary = document.getElementById('usageSummary');
const recentSessionsEl = document.getElementById('recentSessions');
const generatedAtEl = document.getElementById('generatedAt');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatTime(ts) {
  if (!ts) return 'unknown';
  try {
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return 'unknown';
  }
}

function renderMode(meta, sourceName) {
  const mode = meta?.mode || 'demo';
  const titleMap = {
    live: 'Live local API',
    demo: 'Static fallback data',
    unauthorized: 'Unauthorized fallback',
    error: 'Error state'
  };

  modeBanner.className = `mode-banner card ${mode}`;
  modeBanner.innerHTML = `
    <div>
      <div class="section-title">Data Mode</div>
      <div class="mode-title">${escapeHtml(titleMap[mode] || 'Unknown mode')}</div>
      <div class="mode-copy">${escapeHtml(meta?.reason || 'No status detail.')}</div>
    </div>
    <div class="mode-meta">
      <div><span>Source</span><strong>${escapeHtml(meta?.source || sourceName || 'unknown')}</strong></div>
      <div><span>Privacy</span><strong>${escapeHtml(meta?.privacy || 'unknown')}</strong></div>
    </div>
  `;
}

function renderSystem(data) {
  const cards = [
    ['Agents', data?.agents],
    ['Active now', data?.activeAgents],
    ['Gateway', data?.gateway],
    ['Default model', data?.defaultModel],
    ['Channels', Array.isArray(data?.channels) ? data.channels.join(' • ') : (data?.channels || 'n/a')],
    ['Recent sessions', data?.recentSessions],
    ['Total tokens', formatNumber(data?.totalTokens)],
    ['Note', data?.note || 'n/a']
  ];

  systemOverview.innerHTML = cards.map(([k, v]) => `
    <div class="stat">
      <div class="label">${escapeHtml(k)}</div>
      <div class="value">${escapeHtml(v)}</div>
    </div>
  `).join('');
}

function renderUsage(agents) {
  usageSummary.innerHTML = (agents || []).length
    ? agents.map(agent => `
      <div class="list-item compact ${escapeHtml(agent.theme)}">
        <div>
          <strong>${escapeHtml(agent.name)}</strong>
          <div class="item-sub">${escapeHtml(agent.model)} • ${escapeHtml(agent.lastActive)}</div>
        </div>
        <div class="usage-chip">
          <strong>${formatNumber(agent.usageTokens)}</strong>
          <span>${agent.percentUsed == null ? 'n/a' : `${agent.percentUsed}% context`}</span>
        </div>
      </div>
    `).join('')
    : '<div class="detail-empty">No usage data yet.</div>';
}

function renderRecentSessions(items) {
  recentSessionsEl.innerHTML = (items || []).length
    ? items.map(item => `
      <div class="list-item">
        <div>
          <strong>${escapeHtml(item.agentId)}</strong>
          <div class="item-sub">${escapeHtml(item.model)} • ${escapeHtml(item.lastActive)}</div>
        </div>
        <div class="session-metrics">
          <strong>${formatNumber(item.totalTokens)}</strong>
          <span>${item.percentUsed == null ? 'n/a' : `${item.percentUsed}%`}</span>
        </div>
      </div>
    `).join('')
    : '<div class="detail-empty">No recent sessions yet.</div>';
}

function renderAgents(agents) {
  agentGrid.innerHTML = (agents || []).map(agent => `
    <div class="card agent-card ${escapeHtml(agent.theme)}" data-id="${escapeHtml(agent.id)}">
      <div class="agent-head">
        <div>
          <strong>${escapeHtml(agent.name)}</strong>
          <div class="role">${escapeHtml(agent.role)}</div>
        </div>
        <div class="badge status-${escapeHtml(agent.status)}">${escapeHtml(agent.status)}</div>
      </div>
      <div>${escapeHtml(agent.task)}</div>
      <div class="meta">
        <div class="meta-row"><span>Model</span><span>${escapeHtml(agent.model)}</span></div>
        <div class="meta-row"><span>Last active</span><span>${escapeHtml(agent.lastActive)}</span></div>
        <div class="meta-row"><span>Usage</span><span>${escapeHtml(agent.usage)}</span></div>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.agent-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.agent-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const agent = (agents || []).find(a => a.id === card.dataset.id);
      if (agent) renderDetail(agent);
    });
  });
}

function renderDetail(agent) {
  if (!agent) {
    detail.innerHTML = '<div class="detail-empty">No agent selected.</div>';
    return;
  }

  detail.innerHTML = `
    <div class="detail-title">
      <div>
        <h2>${escapeHtml(agent.name)}</h2>
        <div class="role">${escapeHtml(agent.role)}</div>
      </div>
      <div class="badge status-${escapeHtml(agent.status)}">${escapeHtml(agent.status)}</div>
    </div>
    <div class="kv"><strong>Identity</strong><span>${escapeHtml(agent.identity)}</span></div>
    <div class="kv"><strong>Current route</strong><span>${escapeHtml(agent.task)}</span></div>
    <div class="kv"><strong>Model</strong><span>${escapeHtml(agent.model)}</span></div>
    <div class="kv"><strong>Last active</strong><span>${escapeHtml(agent.lastActive)}</span></div>
    <div class="kv"><strong>Total tokens</strong><span>${formatNumber(agent.usageTokens)}</span></div>
    <div class="kv"><strong>Context usage</strong><span>${agent.percentUsed == null ? 'n/a' : `${agent.percentUsed}%`}</span></div>
    <div class="kv"><strong>Bindings</strong><span>${escapeHtml((agent.bindings || []).join(', ') || 'none')}</span></div>
    <div class="timeline">
      ${(agent.timeline || []).map(item => `<div class="timeline-item">${escapeHtml(item)}</div>`).join('')}
    </div>
  `;
}

function getApiToken() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('token');
  if (fromQuery) {
    localStorage.setItem('mcc_api_token', fromQuery);
    const clean = new URL(window.location.href);
    clean.searchParams.delete('token');
    window.history.replaceState({}, '', clean.toString());
    return fromQuery;
  }
  return localStorage.getItem('mcc_api_token') || '';
}

function setGenerated(label) {
  generatedAtEl.textContent = label;
}

async function boot() {
  try {
    let data;
    let sourceName = 'static-json-fallback';
    let mode = 'demo';
    let modeReason = 'Showing static fallback data.';

    try {
      const token = getApiToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const live = await fetch('http://127.0.0.1:8787/api/snapshot?ts=' + Date.now(), { headers, mode: 'cors' });
      if (live.status === 401) throw new Error('unauthorized');
      if (!live.ok) throw new Error('live api unavailable');
      data = await live.json();
      sourceName = 'openclaw-local-api';
      mode = 'live';
      modeReason = 'Reading from the local API with privacy-safe summaries.';
    } catch (liveErr) {
      const res = await fetch('./data.json?ts=' + Date.now());
      data = await res.json();
      sourceName = 'static-json-fallback';
      mode = liveErr?.message === 'unauthorized' ? 'unauthorized' : 'demo';
      modeReason = liveErr?.message === 'unauthorized'
        ? 'Live API rejected this request. Showing static fallback data.'
        : 'Live API unavailable. Showing static fallback data.';
    }

    const safe = {
      ...mockData,
      ...data,
      meta: { ...mockData.meta, ...(data.meta || {}), mode, source: sourceName, reason: modeReason },
      system: { ...mockData.system, ...(data.system || {}) },
      agents: data.agents || mockData.agents,
      recentSessions: data.recentSessions || mockData.recentSessions
    };

    renderMode(safe.meta, sourceName);
    renderSystem(safe.system);
    renderUsage(safe.agents);
    renderRecentSessions(safe.recentSessions);
    renderAgents(safe.agents);
    renderDetail(safe.agents[0]);
    setGenerated(`Updated ${formatTime(safe.meta.generatedAt)} · ${safe.meta.reason || ''}`);
  } catch {
    renderMode({ ...mockData.meta, mode: 'error', source: 'none', reason: 'Could not load live or fallback data.' }, 'none');
    renderSystem(mockData.system);
    renderUsage(mockData.agents);
    renderRecentSessions(mockData.recentSessions);
    renderAgents(mockData.agents);
    detail.innerHTML = '<div class="detail-empty">No real data yet. Run build_data.py.</div>';
    setGenerated('Update failed');
  }
}

refreshBtn.addEventListener('click', boot);
boot();
