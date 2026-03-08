/* ── Niko Robin Dashboard JS ── */
let allRoles      = [];
let createSelected = new Set();
let claimSelected  = new Set();

/* ─── Init ─────────────────────────────────────── */
async function init() {
  await Promise.all([loadStats(), loadRolesAndConfig()]);
  setInterval(loadStats, 30_000);
}

/* ─── Stats ─────────────────────────────────────── */
async function loadStats() {
  try {
    const data = await fetch('/api/stats').then(r => r.json());
    animateCount('stat-total',  data.total  ?? 0);
    animateCount('stat-open',   data.open   ?? 0);
    animateCount('stat-closed', data.closed ?? 0);
    const badge = document.getElementById('open-count');
    if (badge) badge.textContent = data.open ?? 0;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  if (current === target) return;
  const diff     = target - current;
  const steps    = 20;
  const stepVal  = diff / steps;
  let count      = current;
  let i          = 0;
  const timer = setInterval(() => {
    i++;
    count += stepVal;
    el.textContent = Math.round(i === steps ? target : count);
    if (i >= steps) clearInterval(timer);
  }, 30);
}

/* ─── Roles + Config ────────────────────────────── */
async function loadRolesAndConfig() {
  try {
    const [roles, config] = await Promise.all([
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/config').then(r => r.json()),
    ]);

    allRoles       = roles;
    createSelected = new Set(config.ticketCreateRoles || []);
    claimSelected  = new Set(config.ticketClaimRoles  || []);

    renderGrid('create-roles-grid', createSelected, 'create');
    renderGrid('claim-roles-grid',  claimSelected,  'claim');

    document.getElementById('roles-loading').style.display  = 'none';
    document.getElementById('roles-content').style.display  = 'block';
  } catch (e) {
    const el = document.getElementById('roles-loading');
    if (el) el.innerHTML = '<span style="color:#ff5252">⚠️ Failed to load roles — is the bot online?</span>';
  }
}

function renderGrid(containerId, selectedSet, type) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';

  if (!allRoles.length) {
    grid.innerHTML = '<span style="color:var(--muted);font-size:13px">No roles found.</span>';
    return;
  }

  allRoles.forEach(role => {
    const pill = document.createElement('div');
    pill.className = 'role-pill' + (selectedSet.has(role.id) ? ' selected' : '');

    const dot   = document.createElement('span');
    dot.className = 'role-dot';
    dot.style.background = role.color && role.color !== '#000000' ? role.color : '#5865f2';

    const label = document.createElement('span');
    label.textContent = role.name;

    pill.appendChild(dot);
    pill.appendChild(label);
    pill.addEventListener('click', () => toggleRole(pill, role.id, type));
    grid.appendChild(pill);
  });
}

function toggleRole(pill, roleId, type) {
  const set = type === 'create' ? createSelected : claimSelected;
  if (set.has(roleId)) {
    set.delete(roleId);
    pill.classList.remove('selected');
  } else {
    set.add(roleId);
    pill.classList.add('selected');
  }
}

/* ─── Save ──────────────────────────────────────── */
async function saveConfig() {
  const btn = document.getElementById('save-btn');
  btn.disabled    = true;
  btn.textContent = '⏳ Saving…';

  try {
    const res = await fetch('/api/config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketCreateRoles: [...createSelected],
        ticketClaimRoles:  [...claimSelected],
      }),
    });

    if (res.ok) {
      toast('✅', 'Configuration saved successfully!', 'success');
    } else {
      toast('❌', 'Failed to save — server returned an error.', 'error');
    }
  } catch {
    toast('❌', 'Network error — is the server reachable?', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = '💾 Save Configuration';
  }
}

/* ─── Toast ─────────────────────────────────────── */
function toast(icon, msg, type = 'success') {
  const t    = document.getElementById('toast');
  const ic   = document.getElementById('toast-icon');
  const ms   = document.getElementById('toast-msg');
  if (!t) return;
  ic.textContent  = icon;
  ms.textContent  = msg;
  t.className     = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 3800);
}

/* ─── Nav highlight ─────────────────────────────── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

/* ─── Start ─────────────────────────────────────── */
init();
