import { useState, useMemo } from 'react';
import { useMyAttendance, useAttendanceMutations, useCheckInPolicy } from '../../hooks';
import { LoadingSpinner, ErrorState } from '../admin/shared';

const C = {
  bg: '#0A0A0F', surface: '#13131A', surfaceHover: '#1A1A24',
  accent: '#0D9488', accentLight: 'rgba(13,148,136,0.15)',
  teal: '#14B8A6', tealLight: 'rgba(20,184,166,0.15)',
  cyan: '#06B6D4', success: '#10B981', warning: '#F59E0B', danger: '#EF4444',
  text: '#F1F0FF', muted: '#8B8A9B', border: '#2E2E3E',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_MAP = {
  present: { color: C.teal, label: 'Present', abbr: 'P' },
  absent:  { color: C.danger, label: 'Absent', abbr: 'A' },
  on_leave: { color: C.warning, label: 'On Leave', abbr: 'L' },
  half_day: { color: C.cyan, label: 'Half Day', abbr: 'H' },
  future: { color: C.muted, label: '—', abbr: '—' },
};

const ChevIco = ({ dir = 'left' }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={dir === 'left' ? '15 18 9 12 15 6' : '9 6 15 12 9 18'} />
  </svg>
);

const Styles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes attFadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
    .att-card { animation: attFadeUp .4s ease-out both; transition: transform .25s, box-shadow .25s; }
    .att-card:hover { transform: translateY(-3px); }
    .att-row:hover { background: ${C.surfaceHover} !important; }
    @media(max-width:767px) { .att-stats { grid-template-columns: repeat(2,1fr) !important; } }
  `}} />
);

const PAGE_SIZE = 10;

export default function AttendanceView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [page, setPage] = useState(1);

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const { data: attData, isLoading: attLoading, error, refetch } = useMyAttendance({ month: monthStr });
  const { data: policyData, isLoading: policyLoading } = useCheckInPolicy();
  const { checkIn, checkOut, isCheckingIn, isCheckingOut } = useAttendanceMutations();

  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const rawRecords = attData?.data?.items ?? attData?.data ?? attData ?? [];
  const records = Array.isArray(rawRecords) ? rawRecords : [];

  const policy = policyData?.data ?? policyData ?? {};

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const tableData = useMemo(() => {
    const rows = [];
    const todayStr = new Date().toISOString().slice(0, 10);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isFuture = dateStr > todayStr;
      const record = records.find(r => {
        const rDate = r.date ? new Date(r.date).toISOString().slice(0, 10) : '';
        return rDate === dateStr;
      });
      let status;
      if (record) {
        status = record.status;
      } else if (isWeekend) {
        status = 'weekend';
      } else if (isFuture) {
        status = 'future';
      } else {
        status = 'absent';
      }
      rows.push({
        date: dateStr,
        dayName: new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d,
        isWeekend,
        isFuture,
        status,
        checkIn: record?.check_in || record?.checkIn || null,
        checkOut: record?.check_out || record?.checkOut || null,
        workHours: record?.work_hours || record?.workHours || 0,
        extraHours: record?.extra_hours || record?.extraHours || 0,
      });
    }
    return rows;
  }, [records, daysInMonth, year, month]);

  const stats = useMemo(() => {
    let present = 0, absent = 0, leaves = 0, totalHours = 0;
    tableData.forEach(r => {
      if (r.status === 'present') { present++; totalHours += Number(r.workHours || 0); }
      else if (r.status === 'on_leave' || r.status === 'half_day') leaves++;
      else if (!r.isWeekend) absent++;
    });
    const workingDays = tableData.filter(r => !r.isWeekend).length;
    return { present, absent, leaves, totalHours: totalHours.toFixed(1), workingDays };
  }, [tableData]);

  const paged = tableData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(tableData.length / PAGE_SIZE) || 1;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setPage(1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setPage(1); };

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleCheckIn = async () => {
    setGeoError(null);
    if (policy.geofenceRequired) {
      if (!navigator.geolocation) {
        setGeoError('Geolocation is not supported by your browser.');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const d = getDistanceMeters(latitude, longitude, policy.officeLatitude, policy.officeLongitude);
        
        if (d > (policy.radiusMeters || 100)) {
          setGeoError(`You are ${Math.round(d)}m away from the office. You must be within ${policy.radiusMeters || 100}m to check in.`);
          return;
        }

        try { 
          await checkIn({ latitude, longitude }); 
          setIsCheckedIn(true); 
          refetch(); 
        } catch (e) { 
          setGeoError(e?.response?.data?.message || 'Check-in failed');
        }
      }, (err) => {
        setGeoError('Please allow location access to check in.');
      });
    } else {
      try { 
        await checkIn(); 
        setIsCheckedIn(true); 
        refetch(); 
      } catch (e) { 
        setGeoError(e?.response?.data?.message || 'Check-in failed');
      }
    }
  };

  const handleCheckOut = async () => {
    try { await checkOut(); setIsCheckedIn(false); refetch(); } catch (e) { console.error(e); }
  };

  const formatTime = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const isLoading = attLoading || policyLoading;
  if (isLoading) return <LoadingSpinner message="Loading attendance..." />;
  if (error) return <ErrorState message="Failed to load attendance" onRetry={refetch} />;

  return (
    <div style={{ fontFamily: 'Poppins, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <Styles />

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, margin: 0 }}>My Attendance</h1>
          <p style={{ fontSize: 13, color: C.muted, margin: '4px 0 0', fontWeight: 300 }}>Track your daily attendance and working hours</p>
        </div>
        <button
          onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={isCheckingIn || isCheckingOut}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: isCheckedIn ? C.danger : C.teal,
            color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Poppins, sans-serif',
            opacity: (isCheckingIn || isCheckingOut) ? 0.7 : 1,
            transition: 'all .2s',
          }}
        >
          {isCheckingIn ? 'Checking In...' : isCheckingOut ? 'Checking Out...' : isCheckedIn ? '🔴 Check Out' : '🟢 Check In'}
        </button>
      </div>

      {geoError && (
        <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24, color: C.danger, fontSize: 13, fontWeight: 500 }}>
          {geoError}
        </div>
      )}

      {/* MONTH NAV + STATS */}
      <div className="att-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* Month Selector */}
        <div className="att-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div onClick={prevMonth} style={{ cursor: 'pointer', display: 'flex' }}><ChevIco dir="left" /></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{MONTHS[month]}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{year}</div>
          </div>
          <div onClick={nextMonth} style={{ cursor: 'pointer', display: 'flex' }}><ChevIco dir="right" /></div>
        </div>

        {[
          { label: 'Present', value: stats.present, color: C.teal },
          { label: 'Absent', value: stats.absent, color: C.danger },
          { label: 'On Leave', value: stats.leaves, color: C.warning },
          { label: 'Total Hours', value: stats.totalHours, color: C.cyan },
        ].map((s, i) => (
          <div key={s.label} className="att-card" style={{ background: C.surface, borderRadius: 16, border: `1px solid ${C.border}`, padding: 20, animationDelay: `${(i + 1) * 80}ms` }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: C.muted }}>of {stats.workingDays} working days</div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="att-card" style={{ background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden', animationDelay: '300ms' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Date', 'Day', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Extra Hours'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row, i) => {
                const statusInfo = STATUS_MAP[row.status] || { color: C.muted, label: row.isWeekend ? 'Weekend' : row.status, abbr: '—' };
                return (
                  <tr key={row.date} className="att-row" style={{ borderBottom: `1px solid ${C.border}`, background: row.isWeekend ? `${C.surfaceHover}50` : 'transparent', transition: 'background .15s' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: C.text }}>{row.dayNum} {MONTHS[month].slice(0, 3)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: row.isWeekend ? C.muted : C.text }}>{row.dayName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 10,
                        background: `${statusInfo.color}22`, color: statusInfo.color,
                        textTransform: 'uppercase',
                      }}>{statusInfo.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{formatTime(row.checkIn)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: C.text }}>{formatTime(row.checkOut)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: Number(row.workHours) >= 8 ? C.teal : C.warning }}>
                      {Number(row.workHours) > 0 ? `${Number(row.workHours).toFixed(1)}h` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: Number(row.extraHours) > 0 ? C.accent : C.muted }}>
                      {Number(row.extraHours) > 0 ? `+${Number(row.extraHours).toFixed(1)}h` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 12, color: C.muted }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, tableData.length)} of {tableData.length} days
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: page === 1 ? C.muted : C.text, cursor: page === 1 ? 'default' : 'pointer', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 12, color: C.muted }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: page === totalPages ? C.muted : C.text, cursor: page === totalPages ? 'default' : 'pointer', fontSize: 12, fontFamily: 'Poppins, sans-serif' }}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
