/**
 * generateDashboardPDF — client-side PDF report builder
 * Uses html2pdf.js (dynamically imported) — no backend required.
 *
 * @param {object} data  – dashboard data object { summary, faculty, deptData }
 * @param {string} dept  – optional dept filter label
 * @param {object} refs  – { facultyChartRef, trendChartRef } – Chart.js ref objects
 */
export async function generateDashboardPDF(data, dept, refs = {}) {
    const { summary: sum, faculty: facData = [], deptData: deptArr = [] } = data || {};
    const now = new Date().toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    // Capture chart canvases as base64 images
    let barChartImg = '';
    let lineChartImg = '';
    try {
        if (refs.facultyChartRef?.current) barChartImg = refs.facultyChartRef.current.toBase64Image('image/png', 1);
        if (refs.trendChartRef?.current) lineChartImg = refs.trendChartRef.current.toBase64Image('image/png', 1);
    } catch (_) { /* Charts may not be rendered yet — skip images */ }

    const fmt = (v) => (v != null ? (Math.round(v * 100) / 100).toFixed(2) : '—');
    const badge = (r) => {
        const cls = r >= 4 ? '#dcfce7;color:#166534' : r >= 2.5 ? '#fef9c3;color:#854d0e' : '#fee2e2;color:#991b1b';
        return `<span style="background:${cls};padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">${r.toFixed(2)} ★</span>`;
    };

    const facultyRows = facData.slice(0, 25).map((f, i) => {
        const r = parseFloat(f.avgRating || 0);
        return `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
            <td style="padding:7px 10px">${i + 1}</td>
            <td style="padding:7px 10px">${f.facultyName || '—'}</td>
            <td style="padding:7px 10px">${f.department || '—'}</td>
            <td style="padding:7px 10px">${badge(r)}</td>
            <td style="padding:7px 10px">${f.count ?? f.totalFeedback ?? '—'}</td>
        </tr>`;
    }).join('');

    const deptRows = deptArr.map((d, i) => {
        const r = parseFloat(d.avgRating || 0);
        return `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
            <td style="padding:7px 10px">${d.department || d.deptName || '—'}</td>
            <td style="padding:7px 10px">${d.deptCode || '—'}</td>
            <td style="padding:7px 10px">${badge(r)}</td>
            <td style="padding:7px 10px">${d.totalFeedback ?? d.count ?? '—'}</td>
        </tr>`;
    }).join('');

    const th = `background:#0047AB;color:#fff;padding:9px 10px;text-align:left;font-size:12px`;
    const h2 = `font-size:14px;color:#0047AB;border-bottom:2px solid #A7C7E7;padding-bottom:6px;margin:0 0 12px`;
    const sec = `margin-bottom:24px`;

    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; padding: 24px; font-size: 13px; }
  * { box-sizing: border-box; }
</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
    <div>
      <h1 style="font-size:22px;color:#0047AB;margin:0 0 4px">CampusLens Analytics Report</h1>
      <div style="color:#64748b;font-size:12px">Generated: ${now}${dept ? ' · Filtered by department' : ' · All Departments'}</div>
    </div>
    <div style="font-size:11px;color:#94a3b8;text-align:right">Confidential · Anonymous</div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    ${[
            ['Total Feedback', sum?.totalFeedback ?? 0],
            ['Avg Rating', `${fmt(sum?.avgOverallRating)} / 5`],
            ['Active Depts', sum?.activeDepartments ?? 0],
            ['Subjects Rated', sum?.subjectsRated ?? 0],
        ].map(([label, val]) => `
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px">
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">${label}</div>
        <div style="font-size:20px;font-weight:700;color:#0047AB">${val}</div>
      </div>`).join('')}
  </div>

  ${barChartImg ? `<div style="${sec}"><h2 style="${h2}">Faculty Rating Comparison</h2><img src="${barChartImg}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0"/></div>` : ''}
  ${lineChartImg ? `<div style="${sec}"><h2 style="${h2}">Semester Rating Trend</h2><img src="${lineChartImg}" style="max-width:100%;border-radius:8px;border:1px solid #e2e8f0"/></div>` : ''}

  ${facData.length > 0 ? `
  <div style="${sec}">
    <h2 style="${h2}">Faculty Summary (Top ${Math.min(facData.length, 25)})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr><th style="${th}">#</th><th style="${th}">Faculty</th><th style="${th}">Department</th><th style="${th}">Avg Rating</th><th style="${th}">Submissions</th></tr></thead>
      <tbody>${facultyRows}</tbody>
    </table>
  </div>` : ''}

  ${deptArr.length > 0 ? `
  <div style="${sec}">
    <h2 style="${h2}">Department Overview</h2>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead><tr><th style="${th}">Department</th><th style="${th}">Code</th><th style="${th}">Avg Rating</th><th style="${th}">Feedback Count</th></tr></thead>
      <tbody>${deptRows}</tbody>
    </table>
  </div>` : ''}

  <div style="margin-top:24px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px">
    CampusLens · All analytics are aggregated and anonymous. No student identity is revealed in any report.
  </div>
</body></html>`;

    // Dynamically import html2pdf to keep initial bundle size small
    const html2pdf = (await import('html2pdf.js')).default;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    wrapper.style.cssText = 'position:absolute;left:-9999px;width:794px;background:#fff';
    document.body.appendChild(wrapper);

    try {
        await html2pdf()
            .set({
                margin: [10, 10, 10, 10],
                filename: `CampusLens_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            })
            .from(wrapper)
            .save();
    } finally {
        document.body.removeChild(wrapper);
    }
}
