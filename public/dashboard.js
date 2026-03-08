let password = '';
const pwEl = document.getElementById('pw');
const loginBtn = document.getElementById('login');
const content = document.getElementById('content');
const cfgPre = document.getElementById('cfg');
const rolesDiv = document.getElementById('roles');
let cfg = null;

loginBtn.onclick = async () => { password = pwEl.value; await loadConfig(); };

async function loadConfig() {
  const headers = { 'x-dashboard-password': password };
  try {
    const r = await fetch('/api/config', { headers });
    if (!r.ok) throw new Error('auth');
    cfg = await r.json();
    cfgPre.textContent = JSON.stringify(cfg, null, 2);
    content.style.display = 'block';
    await loadRoles();
  } catch (e) { alert('Failed to load — check password'); }
}

async function loadRoles() {
  const r = await fetch('/api/roles', { headers: { 'x-dashboard-password': password } });
  if (!r.ok) { rolesDiv.textContent = 'failed to fetch roles'; return; }
  const roles = await r.json();
  rolesDiv.innerHTML = '';
  const raise = new Set(cfg.ticket.roleCanRaise || []);
  const claim = new Set(cfg.ticket.roleCanClaim || []);
  roles.forEach(role => {
    const el = document.createElement('div');
    el.innerHTML = `\
      <label><input type="checkbox" data-role="${role.id}" data-type="raise" ${raise.has(role.id)?'checked':''} /> Can Raise</label>
      <label style="margin-left:12px;"><input type="checkbox" data-role="${role.id}" data-type="claim" ${claim.has(role.id)?'checked':''} /> Can Claim</label>
      <span style="margin-left:12px">${role.name}</span>
    `;
    rolesDiv.appendChild(el);
  });
}

document.getElementById('save').onclick = async () => {
  const raise = [];
  const claim = [];
  document.querySelectorAll('input[data-role]').forEach(cb => {
    const id = cb.dataset.role;
    const type = cb.dataset.type;
    if (cb.checked) {
      if (type === 'raise') raise.push(id);
      if (type === 'claim') claim.push(id);
    }
  });
  const newCfg = Object.assign({}, cfg, { ticket: Object.assign({}, cfg.ticket, { roleCanRaise: raise, roleCanClaim: claim }) });
  const r = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dashboard-password': password }, body: JSON.stringify(newCfg) });
  if (r.ok) { alert('Saved'); cfg = await r.json().then(x=>x.cfg); cfgPre.textContent = JSON.stringify(cfg, null, 2); } else alert('Save failed');
};