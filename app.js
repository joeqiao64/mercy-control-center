const mockData = {
  system: {
    agents: 3,
    gateway: 'running',
    defaultModel: 'gpt-5.4',
    channel: 'telegram x3',
    note: 'Fallback mock data'
  },
  agents: []
};

const agentGrid = document.getElementById('agentGrid');
const detail = document.getElementById('agentDetail');
const systemOverview = document.getElementById('systemOverview');
const refreshBtn = document.getElementById('refreshBtn');

function renderSystem(data) {
  const entries = Object.entries(data || {});
  systemOverview.innerHTML = entries.map(([k, v]) => `
    <div class="stat">
      <div class="label">${k}</div>
      <div class="value">${v}</div>
    </div>
  `).join('');
}

function renderAgents(agents) {
  agentGrid.innerHTML = (agents || []).map(agent => `
    <div class="card agent-card ${agent.theme}" data-id="${agent.id}">
      <div class="agent-head">
        <div>
          <strong>${agent.name}</strong>
          <div class="role">${agent.role}</div>
        </div>
        <div class="badge">${agent.status}</div>
      </div>
      <div>${agent.task}</div>
      <div class="meta">
        <div class="meta-row"><span>Model</span><span>${agent.model}</span></div>
        <div class="meta-row"><span>Last active</span><span>${agent.lastActive}</span></div>
        <div class="meta-row"><span>Usage</span><span>${agent.usage}</span></div>
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
        <h2>${agent.name}</h2>
        <div class="role">${agent.role}</div>
      </div>
      <div class="badge">${agent.status}</div>
    </div>
    <div class="kv"><strong>Identity</strong><span>${agent.identity}</span></div>
    <div class="kv"><strong>Current task</strong><span>${agent.task}</span></div>
    <div class="kv"><strong>Model</strong><span>${agent.model}</span></div>
    <div class="kv"><strong>Last active</strong><span>${agent.lastActive}</span></div>
    <div class="kv"><strong>Usage</strong><span>${agent.usage}</span></div>
    <div class="timeline">
      ${(agent.timeline || []).map(item => `<div class="timeline-item">${item}</div>`).join('')}
    </div>
  `;
}

async function boot() {
  try {
    const res = await fetch('./data.json?ts=' + Date.now());
    const data = await res.json();
    const agents = data.agents || mockData.agents;
    renderSystem(data.system || mockData.system);
    renderAgents(agents);
    renderDetail(agents[0]);
  } catch (err) {
    renderSystem(mockData.system);
    renderAgents(mockData.agents);
    detail.innerHTML = '<div class="detail-empty">No real data yet. Run build_data.py.</div>';
  }
}

refreshBtn.addEventListener('click', boot);
boot();
