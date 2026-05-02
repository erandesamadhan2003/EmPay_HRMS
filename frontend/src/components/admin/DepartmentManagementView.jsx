import { useState } from 'react';
import { useDepartments, useDepartmentMutations, useEmployees } from '../../hooks';
import { LoadingSpinner, ErrorState } from './shared';

const C = { bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24', accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)', teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)', cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444', text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E' };

const DEPT_COLORS = { Engineering: C.teal, HR: C.accent, Finance: C.cyan, Operations: C.warning, Marketing: '#EC4899', Design: '#F97316' };
const COLOR_SWATCHES = [C.teal, C.accent, C.cyan, C.warning, '#EC4899', '#F97316'];

const PenIco = ({ color }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const TrashIco = ({ color }) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>;
const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{
  __html: `
  @keyframes dmFadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  @keyframes dmModalIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  @keyframes dmOverlay{from{opacity:0}to{opacity:1}}
  .dm-card{animation:dmFadeUp .45s ease-out both;transition:transform .25s,box-shadow .25s}
  .dm-card:hover{transform:translateY(-4px)}
  .dm-abtn{border:none;background:transparent;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all .2s}
  .dm-abtn:hover{transform:scale(1.1)}
  .dm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:dmOverlay .2s ease-out}
  .dm-modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;width:90%;animation:dmModalIn .3s ease-out;position:relative;font-family:Poppins,sans-serif}
  @media(max-width:767px){.dm-grid{grid-template-columns:1fr!important}.dm-stats{grid-template-columns:repeat(2,1fr)!important}}
  @media(min-width:768px) and (max-width:1023px){.dm-grid{grid-template-columns:repeat(2,1fr)!important}}
`}} />;

const mf = { background: C.surfaceHover, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', color: C.text, fontSize: 13, fontFamily: 'Poppins,sans-serif', outline: 'none', width: '100%' };

export default function DepartmentManagementView() {
  const { data: deptData, isLoading, error, refetch } = useDepartments();
  const { data: empData } = useEmployees();
  const { createDepartment, updateDepartment, deleteDepartment, isCreating, isUpdating, isDeleting } = useDepartmentMutations();

  // Backend returns { data: { items: [...], pagination: {...} } }
  const rawDepts = deptData?.data?.items ?? deptData?.data ?? deptData ?? [];
  const DEPTS = (Array.isArray(rawDepts) ? rawDepts : []).map(d => ({
    id: d.id,
    name: d.name || 'Unknown',
    headName: '—',        // not returned by list API; shown when available
    employeeCount: d.employeeCount ?? 0,
    createdDate: d.createdAt || '',
    description: d.description || '',
  }));

  const rawEmps = empData?.data?.items ?? empData?.data ?? empData ?? [];
  // Keep full objects {id, name} so department head dropdown sends real UUID
  const employees = (Array.isArray(rawEmps) ? rawEmps : [])
    .filter(e => e.id && e.name)
    .map(e => ({ id: e.id, name: e.name }));

  const [modal, setModal] = useState(null);
  const [modalDept, setModalDept] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', managerId: '', color: C.teal });
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const totalEmps = DEPTS.reduce((a, d) => a + d.employeeCount, 0);
  const largest = DEPTS.length ? DEPTS.reduce((a, d) => d.employeeCount > a.employeeCount ? d : a, DEPTS[0]) : { name: '—' };
  const newest = DEPTS.length ? DEPTS.reduce((a, d) => new Date(d.createdDate) > new Date(a.createdDate) ? d : a, DEPTS[0]) : { name: '—' };

  const openAdd = () => {
    setForm({ name: '', description: '', managerId: '', color: C.teal });
    setSaveError(''); setSaveSuccess('');
    setModal('add');
  };
  const openEdit = (d) => {
    setForm({ name: d.name, description: d.description, managerId: d.managerId || '', color: DEPT_COLORS[d.name] || C.teal });
    setModalDept(d); setSaveError(''); setSaveSuccess('');
    setModal('edit');
  };
  const openDel = (d) => { setModalDept(d); setModal('delete'); };
  const close = () => { setModal(null); setModalDept(null); setSaveError(''); setSaveSuccess(''); };

  const handleSave = async () => {
    setSaveError(''); setSaveSuccess('');
    if (!form.name.trim()) return setSaveError('Department name is required.');
    try {
      if (modal === 'add') {
        await createDepartment({ name: form.name.trim(), description: form.description });
        setSaveSuccess('Department created successfully!');
      } else if (modal === 'edit' && modalDept) {
        await updateDepartment({ id: modalDept.id, data: { name: form.name.trim(), description: form.description } });
        setSaveSuccess('Department updated successfully!');
      }
      setTimeout(() => close(), 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save department.';
      setSaveError(msg);
      console.error('Save failed:', err);
    }
  };
  const handleDelete = async () => {
    try { if (modalDept) await deleteDepartment(modalDept.id); close(); } catch (err) { console.error('Delete failed:', err); }
  };

  const stats = [
    { label: 'Total Departments', value: DEPTS.length, color: C.accent },
    { label: 'Total Employees', value: totalEmps, color: C.teal },
    { label: 'Largest Department', value: largest.name, color: C.cyan },
    { label: 'Newest Department', value: newest.name, color: C.warning },
  ];

  if (isLoading) return <LoadingSpinner message="Loading departments..." />;
  if (error) return <ErrorState message="Failed to load departments" onRetry={refetch} />;

  return (
    <>
      <Styles />
      <div style={{ fontFamily: 'Poppins,sans-serif', maxWidth: 1200, margin: '0 auto' }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Departments</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Organize your company structure</p>
          </div>
          <button onClick={openAdd} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all .25s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${C.tealLight}`; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}>
            + Add Department
          </button>
        </div>

        {/* STATS ROW */}
        <div className="dm-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="dm-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', animationDelay: `${i * 80}ms` }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: typeof s.value === 'number' ? 28 : 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* DEPARTMENT CARDS */}
        <div className="dm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {DEPTS.map((d, i) => {
            const dc = DEPT_COLORS[d.name] || C.teal;
            return (
              <div key={d.id} className="dm-card" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', animationDelay: `${(i + 4) * 80}ms` }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 28px ${dc}25`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {/* Color strip */}
                <div style={{ height: 4, background: `linear-gradient(90deg,${dc},${dc}88)` }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{d.name}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="dm-abtn" onClick={() => openEdit(d)} onMouseEnter={e => e.currentTarget.style.background = `${dc}18`} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><PenIco color={dc} /></button>
                      <button className="dm-abtn" onClick={() => openDel(d)} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,.12)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><TrashIco color={C.danger} /></button>
                    </div>
                  </div>
                  {/* Head */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${dc}22`, border: `1.5px solid ${dc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: dc }}>
                      {d.headName && d.headName !== '—' ? d.headName[0].toUpperCase() : '?'}
                    </div>
                    <div><div style={{ fontSize: 12, color: C.muted }}>Head</div><div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{d.headName || '—'}</div></div>
                  </div>
                  {/* Count */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: dc }}>{d.employeeCount}</span>
                    <span style={{ fontSize: 12, color: C.muted }}>employees</span>
                  </div>
                  {/* Description */}
                  <p style={{ fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.description}</p>
                  {/* Date */}
                  <div style={{ fontSize: 11, color: C.muted, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                    {d.createdDate ? `Created ${new Date(d.createdDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Recently created'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="dm-overlay" onClick={close}>
          <div className="dm-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{modal === 'add' ? 'Add Department' : 'Edit Department'}</h3>
              <div onClick={close} style={{ cursor: 'pointer' }}><XIco /></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Department Name *</label><input style={mf} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" /></div>
              <div><label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Description</label><textarea style={{ ...mf, minHeight: 70, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" /></div>
              <div><label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>Department Head</label>
                <select style={{ ...mf, cursor: 'pointer' }} value={form.managerId} onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}>
                  <option value="" style={{ background: C.surface }}>Select head (optional)</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id} style={{ background: C.surface }}>{emp.name}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 6 }}>Color</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLOR_SWATCHES.map(c => (
                    <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 32, height: 32, borderRadius: 10, background: c, cursor: 'pointer', border: form.color === c ? '2.5px solid #fff' : '2.5px solid transparent', transition: 'all .2s', opacity: form.color === c ? 1 : 0.5 }} />
                  ))}
                </div>
              </div>
            </div>
            {saveError && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#EF4444', fontWeight: 500 }}>{saveError}</div>}
            {saveSuccess && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', fontSize: 12, color: C.teal, fontWeight: 500 }}>✓ {saveSuccess}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={close} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 22px', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>Cancel</button>
              <button onClick={handleSave} disabled={isCreating || isUpdating || !!saveSuccess} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', opacity: (isCreating || isUpdating) ? 0.6 : 1 }}>{(isCreating || isUpdating) ? 'Saving...' : saveSuccess ? '✓ Done' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE DIALOG */}
      {modal === 'delete' && modalDept && (
        <div className="dm-overlay" onClick={close}>
          <div className="dm-modal" style={{ maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, margin: '0 auto 16px', position: 'relative' }}>
              <div style={{ width: 0, height: 0, borderLeft: '24px solid transparent', borderRight: '24px solid transparent', borderBottom: `42px solid ${C.warning}22`, position: 'absolute', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 700, color: C.warning }}>!</div>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>Delete Department</h3>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Are you sure you want to delete <strong style={{ color: C.text }}>{modalDept.name}</strong>? All {modalDept.employeeCount} employees will need reassignment.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={close} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 22px', color: C.text, fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} style={{ background: C.danger, border: 'none', borderRadius: 10, padding: '10px 22px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', opacity: isDeleting ? 0.6 : 1 }}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
