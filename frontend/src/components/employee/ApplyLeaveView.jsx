import { useState } from 'react';
import { useMyTimeOffAllocations, useTimeOffRequestMutations } from '../../hooks';
import { LoadingSpinner } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const LEAVE_TYPES = [
  { value: 'paid_time_off', label: 'Paid Time Off' },
  { value: 'sick_leave', label: 'Sick Leave' },
  { value: 'unpaid_leave', label: 'Unpaid Leave' },
];

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes alFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .al-card { animation: alFadeUp .4s ease-out both; }
    .al-input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important; }
  `}} />
);

export default function ApplyLeaveView() {
  const { data: allocData, isLoading } = useMyTimeOffAllocations();
  const { createRequest, isCreating } = useTimeOffRequestMutations();

  const [form, setForm] = useState({ leaveType: '', fromDate: '', toDate: '', reason: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const rawAllocs = allocData?.data?.items ?? allocData?.data ?? allocData ?? [];
  const allocs = Array.isArray(rawAllocs) ? rawAllocs : [];

  const formatType = (t) => (t || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSuccess(false);
  };

  const validate = () => {
    const e = {};
    if (!form.leaveType) e.leaveType = 'Leave type is required';
    if (!form.fromDate) e.fromDate = 'Start date is required';
    if (!form.toDate) e.toDate = 'End date is required';
    if (form.fromDate && form.toDate && new Date(form.toDate) < new Date(form.fromDate)) e.toDate = 'End date must be after start date';
    if (!form.reason.trim()) e.reason = 'Reason is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }

    try {
      await createRequest({
        leave_type: form.leaveType,
        from_date: form.fromDate,
        to_date: form.toDate,
        reason: form.reason,
      });
      setSuccess(true);
      setForm({ leaveType: '', fromDate: '', toDate: '', reason: '' });
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

      {/* BALANCE SUMMARY */}
      {allocs.length > 0 && (
        <div className="al-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, marginBottom: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginRight: 'auto' }}>Your Balance:</div>
          {allocs.map((a, i) => {
            const type = a.leave_type || a.leaveType || '';
            const total = Number(a.total_days ?? a.totalDays ?? a.days ?? 0);
            const used = Number(a.used_days ?? a.usedDays ?? 0);
            return (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.teal }}>{total - used}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{formatType(type)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORM */}
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

        <form onSubmit={handleSubmit}>
          {/* Leave Type */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Leave Type *</label>
            <select
              value={form.leaveType}
              onChange={e => handleChange('leaveType', e.target.value)}
              className="al-input"
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="" style={{ background: C.surface }}>Select leave type</option>
              {LEAVE_TYPES.map(t => (
                <option key={t.value} value={t.value} style={{ background: C.surface }}>{t.label}</option>
              ))}
            </select>
            {errors.leaveType && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.leaveType}</span>}
          </div>

          {/* Date Range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>From Date *</label>
              <input type="date" value={form.fromDate} onChange={e => handleChange('fromDate', e.target.value)} className="al-input" style={inputStyle} />
              {errors.fromDate && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.fromDate}</span>}
            </div>
            <div>
              <label style={labelStyle}>To Date *</label>
              <input type="date" value={form.toDate} onChange={e => handleChange('toDate', e.target.value)} className="al-input" style={inputStyle} />
              {errors.toDate && <span style={{ fontSize: 11, color: C.danger, marginTop: 4, display: 'block' }}>{errors.toDate}</span>}
            </div>
          </div>

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
            disabled={isCreating}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${C.teal}, #0F766E)`,
              color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
              opacity: isCreating ? 0.7 : 1, transition: 'opacity .2s',
            }}
          >
            {isCreating ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
