import React from 'react';

type Row = {
  day: string;
  date: string;
  regular?: string;
  overtime?: string;
  sick?: string;
  vacation?: string;
  total?: string;
  activity?: string;
};

const sampleRows: Row[] = [
  { day: 'Thursday', date: '01/07/2021', regular: '8,00', total: '8,00', activity: 'General Meeting (General Conference meeting)' },
  { day: 'Friday', date: '02/07/2021', regular: '8,00', total: '8,00', activity: 'Sent Emails to our Francophone Members (Survey) ; Departmental Meeting' },
  { day: 'Saturday', date: '03/07/2021' },
  { day: 'Sunday', date: '04/07/2021' },
  { day: 'Monday', date: '05/07/2021', regular: '8,00', total: '8,00', activity: 'AAU 15th General Conference (Social media team)' },
  { day: 'Tuesday', date: '06/07/2021', regular: '8,00', total: '8,00', activity: 'General Meeting ; AAU 15th General Conference' },
  { day: 'Wednesday', date: '07/07/2021', regular: '8,00', total: '8,00', activity: 'General Meeting ; AAU 15th General Conference' },
  { day: 'Thursday', date: '08/07/2021', regular: '8,00', total: '8,00', activity: 'General Meeting AAU 15th General Conference' },
  { day: 'Friday', date: '09/07/2021', regular: '8,00', total: '8,00', activity: 'General Conference Meeting, Translation and Voice over' },
  { day: 'Saturday', date: '10/07/2021' },
  { day: 'Sunday', date: '11/07/2021' },
  { day: 'Monday', date: '12/07/2021' },
  { day: 'Tuesday', date: '13/07/2021' },
  { day: 'Wednesday', date: '14/07/2021' },
  { day: 'Thursday', date: '15/07/2021' },
];

export default function TimesheetForm() {
  const [rows, setRows] = React.useState<Row[]>(sampleRows);
  const [id] = React.useState('sample-1');
  const [saving, setSaving] = React.useState(false);
  const [validated, setValidated] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rows, validated }),
      });
    } catch (e) {
      // ignore for now
    }
    setSaving(false);
  };

  const validate = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/timesheets/${id}/validate`, { method: 'PATCH' });
      if (res.ok) setValidated(true);
    } catch (e) {
      // ignore
    }
    setSaving(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, Helvetica, sans-serif', color: '#222' }}>
      <style>{`
        .ts-container { max-width: 1200px; margin: 0 auto; }
        .ts-header { border-bottom: 4px solid #8cbf43; padding-bottom: 12px; margin-bottom: 12px; }
        .ts-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        .ts-left, .ts-right { flex: 1; }
        .ts-left .line { margin: 6px 0; }
        .ts-right { max-width: 380px; }
        .ts-right .field { display:flex; justify-content:space-between; margin:6px 0; }
        .ts-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        .ts-table th, .ts-table td { border: 1px solid #333; padding: 8px; font-size: 13px; vertical-align: top; }
        .ts-table th { background: #f7f7f7; text-align: left; }
        .activity-col { width: 46%; }
        .center { text-align: center; }
        .small { font-size: 12px; color: #555; }
        @media print { .ts-container { max-width: 100%; } }
      `}</style>

      <div className="ts-container">
        <div className="ts-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontWeight: 600 }}>Association of African Universities</h2>
            <div className="small">Pay Period Start Date: <strong>01/07/2021</strong><br />Pay Period End Date: <strong>31/07/2021</strong></div>
          </div>
        </div>

        <div className="ts-top">
          <div className="ts-left">
            <div className="line"><strong>Street Address:</strong> TRINITY AVENUE</div>
            <div className="line"><strong>Address 2:</strong> EAST LEGON</div>
            <div className="line"><strong>City, State ZIP:</strong> ACCRA</div>

            <div style={{ marginTop: 10 }}>
              <div className="line"><strong>Employee:</strong> Alexandra Ampabah Johnson</div>
              <div className="line"><strong>Supervisor:</strong> Vaxwell Amo Hoyte; Mr Ransford Bekoe</div>
            </div>
          </div>

          <div className="ts-right">
            <div className="field"><span className="small">Employee Phone:</span><span>266617990</span></div>
            <div className="field"><span className="small">Employee Email:</span><span style={{ color: '#1a73e8' }}>ajohnson@aau.org</span></div>
          </div>
        </div>

        <table className="ts-table" aria-label="timesheet">
          <thead>
            <tr>
              <th>Day</th>
              <th>Date</th>
              <th className="center">Regular Hrs</th>
              <th className="center">Overtime Hrs</th>
              <th className="center">Sick</th>
              <th className="center">Vacation</th>
              <th className="center">Total</th>
              <th className="activity-col">Activity Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.day}</td>
                <td>{r.date}</td>
                <td className="center"><input value={r.regular || ''} onChange={(e) => { const copy = [...rows]; copy[i].regular = e.target.value; setRows(copy); }} style={{ width: '60px' }} /></td>
                <td className="center"><input value={r.overtime || ''} onChange={(e) => { const copy = [...rows]; copy[i].overtime = e.target.value; setRows(copy); }} style={{ width: '60px' }} /></td>
                <td className="center"><input value={r.sick || ''} onChange={(e) => { const copy = [...rows]; copy[i].sick = e.target.value; setRows(copy); }} style={{ width: '60px' }} /></td>
                <td className="center"><input value={r.vacation || ''} onChange={(e) => { const copy = [...rows]; copy[i].vacation = e.target.value; setRows(copy); }} style={{ width: '60px' }} /></td>
                <td className="center"><input value={r.total || ''} onChange={(e) => { const copy = [...rows]; copy[i].total = e.target.value; setRows(copy); }} style={{ width: '60px' }} /></td>
                <td style={{ whiteSpace: 'pre-wrap' }}><textarea value={r.activity || ''} onChange={(e) => { const copy = [...rows]; copy[i].activity = e.target.value; setRows(copy); }} style={{ width: '100%' }} /></td>
              </tr>
            ))}

            {/* Add a few empty rows to mimic full month layout */}
            {Array.from({ length: 6 }).map((_, idx) => (
              <tr key={`empty-${idx}`}>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ padding: '8px 12px' }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={validate} disabled={saving || validated} style={{ padding: '8px 12px' }}>{validated ? 'Validated' : 'Validate'}</button>
          <button onClick={() => window.print()} style={{ padding: '8px 12px' }}>Print</button>
        </div>
      </div>
    </div>
  );
}
