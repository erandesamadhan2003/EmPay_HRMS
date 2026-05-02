import { useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { useSalaryStructures, useSalaryStructureMutations } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../../components/admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#7C3AED', accentLight: 'rgba(124,58,237,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const EditIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIco = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const PlusIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIco = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const Styles = () => <style dangerouslySetInnerHTML={{__html:`
  .sm-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 24px; animation: smFade .4s ease-out both; }
  .sm-row { transition: background .15s; }
  .sm-row:hover { background: ${C.surfaceHover} !important; }
  .sm-abtn { background: transparent; border: none; cursor: pointer; width: 30px; height: 30px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; transition: all .2s; }
  .sm-abtn:hover { transform: scale(1.1); background: rgba(255,255,255,0.05); }
  @keyframes smFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .sm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); backdrop-filter: blur(6px); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .sm-modal { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 20px; padding: 28px; width: 90%; max-width: 480px; position: relative; font-family: Poppins,sans-serif; }
  .sm-input { width: 100%; background: ${C.surfaceHover}; border: 1px solid ${C.border}; border-radius: 10px; padding: 10px 14px; color: ${C.text}; font-size: 13px; outline: none; transition: border-color .2s; margin-bottom: 16px; }
  .sm-input:focus { border-color: ${C.teal}; }
  .sm-label { font-size: 11px; color: ${C.muted}; text-transform: uppercase; letter-spacing: .04em; font-weight: 500; margin-bottom: 6px; display: block; }
`}}/>;

export default function SalaryManagement() {
  const stored = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = stored.name || 'Payroll Officer';
  const userInitials = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: structuresData, isLoading, error, refetch } = useSalaryStructures();
  const { createSalaryStructure, updateSalaryStructure, deleteSalaryStructure, isCreating, isUpdating, isDeleting } = useSalaryStructureMutations();

  const [modal, setModal] = useState({ open: false, data: null });

  const rawStructures = structuresData?.data?.items ?? structuresData?.data ?? structuresData ?? [];
  const structures = Array.isArray(rawStructures) ? rawStructures : [];

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      wageType: fd.get('wageType') || 'fixed_wage',
      pfRate: Number(fd.get('pfRate')),
      professionalTax: Number(fd.get('professionalTax'))
    };

    try {
      if (modal.data?.id) {
        await updateSalaryStructure({ id: modal.data.id, data: payload });
      } else {
        await createSalaryStructure(payload);
      }
      setModal({ open: false, data: null });
    } catch (err) {
      console.error('Failed to save structure:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this structure? It might break existing mappings.')) {
      await deleteSalaryStructure(id);
    }
  };

  const th = { padding: '14px 16px', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: `1px solid ${C.border}`, textAlign: 'left', whiteSpace: 'nowrap' };
  const td = { padding: '14px 16px', fontSize: 13, color: C.text, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' };

  return (
    <MainLayout role="payroll" pageTitle="Salary Management" userName={userName} userInitials={userInitials}>
      <Styles />
      <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: C.text, margin: 0 }}>Salary Structures</h2>
            <p style={{ fontSize: 13, color: C.muted, fontWeight: 300, marginTop: 4 }}>Define standard global structures for employee payroll calculations.</p>
          </div>
          <button onClick={() => setModal({ open: true, data: null })} style={{ background: C.teal, color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
            <PlusIco /> New Structure
          </button>
        </div>

        <div className="sm-card" style={{ padding: 0, overflow: 'auto' }}>
          {isLoading && <LoadingSpinner message="Loading structures..." />}
          {error && <ErrorState message="Failed to load structures" onRetry={refetch} />}
          
          {!isLoading && !error && (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={th}>Structure Name</th>
                  <th style={th}>Wage Type</th>
                  <th style={th}>PF Rate (%)</th>
                  <th style={th}>Professional Tax</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: 'center', padding: 40, color: C.muted }}>No salary structures defined.</td></tr>}
                {structures.map((s, i) => (
                  <tr key={s.id} className="sm-row" style={{ background: i % 2 ? C.surfaceHover : 'transparent' }}>
                    <td style={{ ...td, fontWeight: 600 }}>{s.name}</td>
                    <td style={td}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: `${C.cyan}15`, color: C.cyan, textTransform: 'capitalize' }}>
                        {(s.wageType || s.wage_type || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td style={td}>{s.pfRate || s.pf_rate}%</td>
                    <td style={td}>₹{(s.professionalTax || s.professional_tax || 0).toLocaleString('en-IN')}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="sm-abtn" onClick={() => setModal({ open: true, data: s })}><EditIco /></button>
                        <button className="sm-abtn" onClick={() => handleDelete(s.id)} disabled={isDeleting}><TrashIco /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* MODAL */}
        {modal.open && (
          <div className="sm-overlay" onClick={() => setModal({ open: false, data: null })}>
            <div className="sm-modal" onClick={e => e.stopPropagation()}>
              <div onClick={() => setModal({ open: false, data: null })} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer' }}><XIco /></div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, margin: '0 0 20px' }}>
                {modal.data ? 'Edit Structure' : 'Create Structure'}
              </h3>
              
              <form onSubmit={handleSave}>
                <label className="sm-label">Structure Name</label>
                <input required name="name" defaultValue={modal.data?.name} className="sm-input" placeholder="e.g. Standard Tier 1" />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="sm-label">Wage Type</label>
                    <select name="wageType" defaultValue={modal.data?.wageType || modal.data?.wage_type || 'fixed_wage'} className="sm-input">
                      <option value="fixed_wage">Fixed Wage</option>
                      <option value="hourly_wage">Hourly Wage</option>
                      <option value="pro_rated">Pro Rated</option>
                    </select>
                  </div>
                  <div>
                    <label className="sm-label">PF Rate (%)</label>
                    <input required type="number" step="0.01" name="pfRate" defaultValue={modal.data?.pfRate || modal.data?.pf_rate || 12} className="sm-input" />
                  </div>
                </div>

                <label className="sm-label">Professional Tax (₹)</label>
                <input required type="number" step="0.01" name="professionalTax" defaultValue={modal.data?.professionalTax || modal.data?.professional_tax || 200} className="sm-input" />

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={() => setModal({ open: false, data: null })} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 20px', color: C.text, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isCreating || isUpdating} style={{ background: C.teal, border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (isCreating || isUpdating) ? 0.6 : 1 }}>
                    {isCreating || isUpdating ? 'Saving...' : 'Save Structure'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
