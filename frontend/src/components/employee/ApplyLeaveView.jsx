import { useState, useMemo } from 'react';
import { useMyTimeOffAllocations, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const Styles = () => (
  <style dangerouslySetInnerHTML={{
    __html: `
    @keyframes alFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .al-card { animation: alFadeUp .4s ease-out both; }
    .al-input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; }
  `}} />
);

// Calculate business days (weekdays only) between two dates
function calculateBusinessDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const dow = dt.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export default function ApplyLeaveView() {
  const { data: allocData, isLoading } = useMyTimeOffAllocations();
  const { createRequest, isCreating } = useTimeOffRequestMutations();

  const [form, setForm] = useState({ allocationId: '', startDate: '', endDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const allocs = Array.isArray(rawAllocs) ? rawAllocs : [];

  // Get selected allocation details
  const selectedAlloc = allocs.find(a => a.id === form.allocationId);
  const totalDays = selectedAlloc ? Number(selectedAlloc.allocatedDays ?? selectedAlloc.total_days ?? selectedAlloc.totalDays ?? 0) : 0;
  const usedDays = selectedAlloc ? Number(selectedAlloc.usedDays ?? selectedAlloc.used_days ?? 0) : 0;
  const remainingDays = selectedAlloc ? Number(selectedAlloc.availableDays ?? Math.max(0, totalDays - usedDays)) : 0;

  // Calculate days for current selection
  const requestedDays = useMemo(() => {
    return calculateBusinessDays(form.startDate, form.endDate);
  }, [form.startDate, form.endDate]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSuccess(false);
  };

  const validate = () => {
    const e = {};
    if (!form.allocationId) e.allocationId = 'Allocation is required';
    if (!form.startDate) e.startDate = 'Start date is required';
    if (!form.endDate) e.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = 'End date must be after start date';
    }
    if (!form.reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    try {
      await createRequest({
        allocationId: form.allocationId,
        startDate: form.startDate,
        endDate: form.endDate,
        daysRequested: requestedDays,
        reason: form.reason,
      });
      setSuccess(true);
      setForm({ allocationId: '', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      setErrors({ submit: err?.response?.data?.message || 'Failed to submit leave request' });
    }
  };

  const inputStyle = {
    width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10,
    padding: '12px 16px', fontSize: 14, color: C.text, outline: 'none',
    fontFamily: 'Poppins, sans-serif', transition: 'border-color .3s, box-shadow .3s',
    boxSizing: 'border-box',
  };

  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: C.muted, marginBottom: 6 };

  if (isLoading) return <LoadingSpinner message="Loading..." />;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 700, margin: '0 auto' }}>
      <Styles />

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>Apply for Leave</h1>
        <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0', fontWeight: 300 }}>Submit a new leave request for approval</p>
      </div>

      {/* NO ALLOCATIONS MESSAGE */}
      {allocs.length === 0 && (
        <div className="al-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 32, textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 8px' }}>No Leave Allocations</h3>
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Your HR team hasn't assigned any leave allocations yet. Please contact your HR department to get started.</p>
        </div>
      )}

      {/* BALANCE SUMMARY */}
      {allocs.length > 0 && (
        <div className="al-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginRight: 'auto' }}>Your Balance:</div>
          {allocs.map((a, i) => {
            const type = (a.leave_type || a.leaveType || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const total = Number(a.allocatedDays ?? a.total_days ?? a.totalDays ?? 0);
            const used = Number(a.usedDays ?? a.used_days ?? 0);
            const bal = Number(a.availableDays ?? Math.max(0, total - used));
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{bal}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{type}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM */}
      {allocs.length > 0 && (
        <div className="al-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, padding: 32, animationDelay: '100ms' }}>
          {success && (
            <div style={{ background: `${C.teal}15`, border: `1px solid ${C.teal}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: C.teal, fontSize: 13, fontWeight: 500 }}>
              ✅ Leave request submitted successfully! It will be reviewed by your manager.
            </div>
          )}

          {errors.submit && (
            <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: C.danger, fontSize: 13, fontWeight: 500 }}>
              {errors.submit}
            </div>
          )}

          {errors.days && (
            <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: C.warning, fontSize: 13, fontWeight: 500 }}>
              ⚠️ {errors.days}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Allocation Selection */}
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Select Leave Type *</label>
              <select
                value={form.allocationId}
                onChange={e => handleChange('allocationId', e.target.value)}
                className="al-input"
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="" style={{ background: C.surface }}>Choose a leave allocation</option>
                {allocs.map(a => {
                  const type = (a.leaveType || a.leave_type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const total = Number(a.allocatedDays ?? a.total_days ?? a.totalDays ?? 0);
                  const used = Number(a.usedDays ?? a.used_days ?? 0);
                  const remaining = Number(a.availableDays ?? Math.max(0, total - used));
                  return (
                    <option key={a.id} value={a.id} style={{ background: C.surface }}>
                      {type} — {remaining} day{remaining !== 1 ? 's' : ''} remaining
                    </option>
                  );
                })}
              </select>
              {errors.allocationId && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.allocationId}</span>}
            </div>

            {/* Date Range */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>From Date *</label>
                <input type="date" value={form.startDate} onChange={e => handleChange('startDate', e.target.value)} className="al-input" style={inputStyle} />
                {errors.startDate && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.startDate}</span>}
              </div>
              <div>
                <label style={labelStyle}>To Date *</label>
                <input type="date" value={form.endDate} onChange={e => handleChange('endDate', e.target.value)} className="al-input" style={inputStyle} />
                {errors.endDate && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.endDate}</span>}
              </div>
            </div>

            {/* Days Summary */}
            {form.startDate && form.endDate && selectedAlloc && (
              <div style={{ background: C.bg, borderRadius: 12, padding: 16, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Days Requested</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.cyan }}>{requestedDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Days Remaining</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: remainingDays >= requestedDays ? C.teal : C.danger }}>{remainingDays}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: remainingDays >= requestedDays ? C.success : C.warning }}>
                    {remainingDays >= requestedDays ? '✓ OK' : '⚠️ Balance Exceeded'}
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>Reason *</label>
              <textarea
                value={form.reason}
                onChange={e => handleChange('reason', e.target.value)}
                className="al-input"
                rows={4}
                placeholder="Briefly describe the reason for your leave..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              {errors.reason && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.reason}</span>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isCreating || !form.allocationId}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: form.allocationId ? `linear-gradient(135deg, ${C.teal}, #0F766E)` : C.muted,
                color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
                opacity: isCreating ? 0.7 : 1, transition: 'opacity .2s',
              }}
            >
              {isCreating ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
