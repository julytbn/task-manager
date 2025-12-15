'use client'

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
  const [saving, setSaving] = React.useState(false);
  const [validated, setValidated] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  
  // Required fields for timesheet
  const [employeeId, setEmployeeId] = React.useState('');
  const [taskId, setTaskId] = React.useState('');
  const [projectId, setProjectId] = React.useState('');
  const [timesheetId, setTimesheetId] = React.useState('');

  const save = async () => {
    // Validate required fields
    if (!employeeId || !taskId || !projectId) {
      setError('Veuillez remplir tous les champs requis: Employé, Tâche, Projet');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Calculate total regular hours from rows
      const totalRegularHrs = rows.reduce((sum, row) => {
        const hours = parseFloat(row.regular?.replace(',', '.') || '0');
        return sum + (isNaN(hours) ? 0 : hours);
      }, 0);

      const payload = {
        employeeId,
        taskId,
        projectId,
        date: new Date().toISOString(),
        regularHrs: Math.round(totalRegularHrs),
        overtimeHrs: 0,
        sickHrs: 0,
        vacationHrs: 0,
        description: `Timesheet pour la semaine du ${rows[0]?.date}`,
      };

      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Erreur lors de la création du timesheet');
        return;
      }

      setTimesheetId(data.data.id);
      setSuccess('Timesheet créé avec succès!');
      
    } catch (e) {
      setError(`Erreur: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setSaving(false);
  };

  const validate = async () => {
    if (!timesheetId) {
      setError('Veuillez créer le timesheet d\'abord');
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/timesheets/${timesheetId}/validate`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', validePar: 'manager-id' })
      });
      
      if (res.ok) {
        setValidated(true);
        setSuccess('Timesheet validé!');
      } else {
        const data = await res.json();
        setError(data.message || 'Erreur lors de la validation');
      }
    } catch (e) {
      setError(`Erreur: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
        .ts-form-section { 
          background: #f9f9f9; 
          padding: 15px; 
          margin-bottom: 15px; 
          border-radius: 5px;
          border-left: 4px solid #8cbf43;
        }
        .ts-form-row { 
          display: grid; 
          grid-template-columns: 1fr 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 12px;
        }
        .ts-form-group { 
          display: flex; 
          flex-direction: column;
        }
        .ts-form-group label { 
          font-weight: 600; 
          margin-bottom: 5px; 
          font-size: 13px;
        }
        .ts-form-group input, .ts-form-group select { 
          padding: 8px; 
          border: 1px solid #ccc; 
          border-radius: 4px;
          font-size: 13px;
        }
        .ts-alert { 
          padding: 12px; 
          margin-bottom: 15px; 
          border-radius: 4px;
          font-size: 13px;
        }
        .ts-alert.error { 
          background: #fee; 
          color: #c00; 
          border: 1px solid #fcc;
        }
        .ts-alert.success { 
          background: #efe; 
          color: #080; 
          border: 1px solid #cfc;
        }
        @media print { .ts-container { max-width: 100%; } .ts-form-section { display: none; } }
      `}</style>

      <div className="ts-container">
        {/* Required Fields Section */}
        <div className="ts-form-section">
          <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>📋 Informations Requises</h3>
          <div className="ts-form-row">
            <div className="ts-form-group">
              <label>Employé (ID) *</label>
              <input 
                type="text" 
                value={employeeId} 
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="ex: emp-123"
              />
            </div>
            <div className="ts-form-group">
              <label>Tâche (ID) *</label>
              <input 
                type="text" 
                value={taskId} 
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="ex: task-456"
              />
            </div>
            <div className="ts-form-group">
              <label>Projet (ID) *</label>
              <input 
                type="text" 
                value={projectId} 
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="ex: proj-789"
              />
            </div>
          </div>
        </div>

        {/* Messages d'erreur/succès */}
        {error && <div className="ts-alert error">❌ {error}</div>}
        {success && <div className="ts-alert success">✅ {success}</div>}

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
          <button 
            onClick={save} 
            disabled={saving || !employeeId || !taskId || !projectId} 
            style={{ 
              padding: '10px 16px',
              backgroundColor: saving ? '#ccc' : '#8cbf43',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving || !employeeId || !taskId || !projectId ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {saving ? '⏳ Enregistrement...' : '💾 Enregistrer Timesheet'}
          </button>
          <button 
            onClick={validate} 
            disabled={saving || validated || !timesheetId} 
            style={{ 
              padding: '10px 16px',
              backgroundColor: validated ? '#4CAF50' : (!timesheetId ? '#ccc' : '#2196F3'),
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: validated || !timesheetId ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            {validated ? '✅ Validé' : '🔍 Valider'}
          </button>
          <button 
            onClick={() => window.print()} 
            style={{ 
              padding: '10px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>
    </div>
  );
}
