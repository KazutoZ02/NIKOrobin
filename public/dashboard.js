let allRoles = [];
let createSelected = new Set();
let claimSelected = new Set();

async function init() {
  await loadStats();
  await loadRolesAndConfig();
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('stat-total').textContent = data.total;
    document.getElementById('stat-open').textContent = data.open;
    document.getElementById('stat-closed').textContent = data.closed;
  } catch (e) {
    console.error('Stats error:', e);
  }
}

async function loadRolesAndConfig() {
  try {
    const [rolesRes, configRes] = await Promise.all([
      fetch('/api/roles'),
      fetch('/api/config'),
    ]);
    allRoles = await rolesRes.json();
    const config = await configRes.json();
    createSelected = new Set(config.ticketCreateRoles || []);
    claimSelected = new Set(config.ticketClaimRoles || []);

    renderRoleGrid('create-roles-grid', createSelected, 'create');
    renderRoleGrid('claim-roles-grid', claimSelected, 'claim');

    document.getElementById('roles-loading').style.display = 'none';
    document.getElementById('roles-content').style.display = 'block';
  } catch (e) {
    document.getElementById('roles-loading').innerHTML =
      '❌ Failed to load roles. Is the bot online?';
    console.error(e);
  }
}

function renderRoleGrid(containerId, selectedSet, type) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';

  if (allRoles.length === 0) {
    grid.innerHTML = '<span style="color:var(--muted);font-size:13px">No roles found.</span>';
    return;
  }

  allRoles.forEach((role) => {
    const pill = document.createElement('div');
    pill.className = 'role-pill' + (selectedSet.has(role.id) ? ' selected' : '');
    pill.dataset.id = role.id;
    pill.dataset.type = type;

    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = role.color !== '#000000' ? role.color : '#7289da';

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

async function saveConfig() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Saving…';

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketCreateRoles: [...createSelected],
        ticketClaimRoles: [...claimSelected],
      }),
    });

    if (res.ok) {
      showToast('✅ Configuration saved successfully!', 'success');
    } else {
      showToast('❌ Failed to save configuration.', 'error');
    }
  } catch (e) {
    showToast('❌ Network error. Is the server running?', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Save Configuration';
  }
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  setTimeout(() => {
    t.className = '';
  }, 3500);
}

// Nav highlight
document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((i) =>
      i.classList.remove('active')
    );
    item.classList.add('active');
  });
});

// Auto-refresh stats every 30s
setInterval(loadStats, 30000);

init();
