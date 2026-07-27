const fs = require('fs');
const path = require('path');

const f = path.join(__dirname, 'unified-login/src/WebmailDashboard.js');
let c = fs.readFileSync(f, 'utf8');

// 1. Add rules state after oooEditing
c = c.replace(
  `  const [oooEditing, setOooEditing] = useState(false);`,
  `  const [oooEditing, setOooEditing] = useState(false);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: '', condition_field: 'from', condition_operator: 'contains', condition_value: '', action_type: 'move', action_value: 'spam' });
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [applyingRules, setApplyingRules] = useState(false);`
);

// 2. Add rules functions before fetchOoo
c = c.replace(
  `  const fetchOoo = async () => {`,
  `  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules', { headers: auth });
      const data = await res.json();
      if (data.success) setRules(data.data);
    } catch {}
    setRulesLoading(false);
  };

  const saveRule = async () => {
    if (!ruleForm.name || !ruleForm.condition_value) return alert('Name and condition value required');
    if (ruleForm.action_type === 'move' && !ruleForm.action_value) return alert('Destination folder required for move action');
    setRuleSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });
      const data = await res.json();
      if (data.success) {
        setRules(prev => [...prev, data.data]);
        setRuleFormOpen(false);
        setRuleForm({ name: '', condition_field: 'from', condition_operator: 'contains', condition_value: '', action_type: 'move', action_value: 'spam' });
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setRuleSaving(false);
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await fetch(\`https://api.ssgzone.in/api/v1/rules/\${id}\`, { method: 'DELETE', headers: auth });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRule = async (id) => {
    const res = await fetch(\`https://api.ssgzone.in/api/v1/rules/\${id}/toggle\`, { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setRules(prev => prev.map(r => r.id === id ? data.data : r));
  };

  const applyRules = async () => {
    setApplyingRules(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules/apply', { method: 'POST', headers: auth });
      const data = await res.json();
      if (data.success) {
        alert(\`Rules applied - \${data.affected} email(s) updated\`);
        fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setApplyingRules(false);
  };

  const fetchOoo = async () => {`
);

// 3. Add rules nav item before OOO nav item
c = c.replace(
  `          <div onClick={() => { setActiveNav('ooo'); fetchOoo(); }}`,
  `          <div onClick={() => { setActiveNav('rules'); fetchRules(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'rules' ? c.primaryLight : 'transparent', color: activeNav === 'rules' ? c.primary : c.text, fontWeight: activeNav === 'rules' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>⚙️</span>
            {!sidebarCollapsed && <span>Email Rules</span>}
          </div>
          <div onClick={() => { setActiveNav('ooo'); fetchOoo(); }}`
);

// 4. Add rules panel before OOO panel
const rulesPanel = `        ) : activeNav === 'rules' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Email Rules</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Auto-sort, star, or mark emails based on conditions</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={applyRules} disabled={applyingRules}
                  style={{ padding: '9px 16px', border: \`1px solid \${c.border}\`, borderRadius: 8, background: 'none', cursor: applyingRules ? 'not-allowed' : 'pointer', fontSize: 13, color: c.text, opacity: applyingRules ? 0.6 : 1 }}>
                  {applyingRules ? 'Applying...' : '▶ Apply to Inbox'}
                </button>
                <button onClick={() => setRuleFormOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + New Rule
                </button>
              </div>
            </div>

            {ruleFormOpen && (
              <div style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>New Rule</div>
                <input value={ruleForm.name} onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Rule name *"
                  style={{ width: '100%', padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select value={ruleForm.condition_field} onChange={e => setRuleForm(p => ({ ...p, condition_field: e.target.value }))}
                    style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="from">From</option>
                    <option value="subject">Subject</option>
                    <option value="body">Body</option>
                  </select>
                  <select value={ruleForm.condition_operator} onChange={e => setRuleForm(p => ({ ...p, condition_operator: e.target.value }))}
                    style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="starts_with">starts with</option>
                  </select>
                  <input value={ruleForm.condition_value} onChange={e => setRuleForm(p => ({ ...p, condition_value: e.target.value }))}
                    placeholder="Value *"
                    style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <select value={ruleForm.action_type} onChange={e => setRuleForm(p => ({ ...p, action_type: e.target.value, action_value: e.target.value === 'move' ? 'spam' : '' }))}
                    style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="move">Move to folder</option>
                    <option value="star">Star</option>
                    <option value="mark_read">Mark as read</option>
                    <option value="mark_unread">Mark as unread</option>
                  </select>
                  {ruleForm.action_type === 'move' && (
                    <select value={ruleForm.action_value} onChange={e => setRuleForm(p => ({ ...p, action_value: e.target.value }))}
                      style={{ padding: '9px 12px', border: \`1px solid \${c.border}\`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value="spam">Spam</option>
                      <option value="trash">Trash</option>
                      <option value="drafts">Drafts</option>
                      <option value="inbox">Inbox</option>
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveRule} disabled={ruleSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: ruleSaving ? 'not-allowed' : 'pointer', opacity: ruleSaving ? 0.7 : 1 }}>
                    {ruleSaving ? 'Saving...' : 'Save Rule'}
                  </button>
                  <button onClick={() => setRuleFormOpen(false)}
                    style={{ background: 'none', border: \`1px solid \${c.border}\`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {rulesLoading && <div style={{ color: c.textMuted, fontSize: 13, padding: 20 }}>Loading...</div>}

            {!rulesLoading && rules.length === 0 && !ruleFormOpen && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No rules yet</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Create rules to automatically sort, star, or mark your emails</div>
              </div>
            )}

            {rules.map(rule => (
              <div key={rule.id} style={{ background: c.card, border: \`1px solid \${c.border}\`, borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div onClick={() => toggleRule(rule.id)}
                  style={{ width: 40, height: 22, borderRadius: 11, background: rule.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: rule.is_active ? 21 : 3, transition: 'left 0.2s' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                    If <strong>{rule.condition_field}</strong> {rule.condition_operator.replace('_', ' ')} "<strong>{rule.condition_value}</strong>"
                    {' \u2192 '}<strong>{rule.action_type === 'move' ? \`move to \${rule.action_value}\` : rule.action_type.replace('_', ' ')}</strong>
                  </div>
                </div>
                <button onClick={() => deleteRule(rule.id)}
                  style={{ padding: '6px 12px', border: \`1px solid \${c.danger}\`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : activeNav === 'ooo' ? (`;

c = c.replace(`        ) : activeNav === 'ooo' ? (`, rulesPanel);

fs.writeFileSync(f, c, 'utf8');
console.log('Done. fetchRules:', c.includes('fetchRules'), '| Email Rules panel:', c.includes('Email Rules'));
