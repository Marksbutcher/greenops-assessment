import { useAssessment } from '../context/AssessmentContext';
import { DOMAINS, OVERALL_MATURITY_CHARACTERISTICS } from '../data/domains';
import { MATURITY_DESCRIPTIONS } from '../data/maturityDescriptions';
import { NEXT_STEPS, STRATEGIC_PATTERNS } from '../data/recommendations';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale, PointElement, LineElement, Filler,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler,
  CategoryScale, LinearScale, BarElement,
  Tooltip, Legend,
);

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Use maturity-level colours for bar fills
function getBarColor(percentage, answered) {
  if (answered === 0) return '#E5E7EB'; // light grey for unanswered
  if (percentage <= 20) return '#9CA3AF';  // grey - Initial
  if (percentage <= 40) return '#60A5FA';  // blue - Emerging
  if (percentage <= 60) return '#F3A261';  // orange - Established
  if (percentage <= 80) return '#00A996';  // teal - Optimised
  return '#0F1F2E';                         // navy - Leading
}

// Severity styling for strategic insight cards
const INSIGHT_STYLES = {
  high: {
    border: 'border-red-400',
    bg: 'bg-red-50',
    iconColor: 'text-red-500',
    label: 'bg-red-100 text-red-700',
  },
  medium: {
    border: 'border-orange',
    bg: 'bg-orange-50',
    iconColor: 'text-orange',
    label: 'bg-orange-100 text-orange-700',
  },
  positive: {
    border: 'border-teal',
    bg: 'bg-teal-light',
    iconColor: 'text-teal',
    label: 'bg-teal-light text-teal-dark',
  },
  info: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    label: 'bg-blue-100 text-blue-700',
  },
};

function InsightIcon({ type }) {
  if (type === 'warning' || type === 'alert') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  if (type === 'positive') {
    return (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function Results() {
  const navigate = useNavigate();
  const radarRef = useRef(null);
  const barRef = useRef(null);
  const {
    organisation,
    getAllDomainScores,
    getOverallScore,
    getExportData,
    isAssessmentComplete,
    resetAssessment,
  } = useAssessment();

  const [domainScores, setDomainScores] = useState([]);
  const [overall, setOverall] = useState(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!organisation) {
      navigate('/');
      return;
    }
    setDomainScores(getAllDomainScores());
    setOverall(getOverallScore());
    setComplete(isAssessmentComplete());
  }, [organisation]);

  // Compute strengths and priority areas (only from domains with at least one answer)
  const { topDomains, bottomDomains } = useMemo(() => {
    if (domainScores.length === 0) return { topDomains: [], bottomDomains: [] };
    const answered = domainScores.filter((d) => d.answered > 0);
    if (answered.length === 0) return { topDomains: [], bottomDomains: [] };
    const sorted = [...answered].sort((a, b) => b.percentage - a.percentage);
    return {
      topDomains: sorted.slice(0, Math.min(3, sorted.length)),
      bottomDomains: sorted.length > 3
        ? sorted.slice(-3).reverse()  // worst first
        : [],                          // not enough answered domains to separate top from bottom
    };
  }, [domainScores]);

  // Compute strategic insights from score patterns
  const strategicInsights = useMemo(() => {
    if (domainScores.length === 0) return [];
    return STRATEGIC_PATTERNS
      .map((pattern) => {
        const result = pattern.test(domainScores);
        if (!result) return null;
        return { ...pattern, ...result };
      })
      .filter(Boolean);
  }, [domainScores]);

  // Get recommended next steps for the current maturity level
  const nextSteps = useMemo(() => {
    if (!overall) return null;
    return NEXT_STEPS[overall.maturity.name] || null;
  }, [overall]);

  // Separate answered vs unanswered domains
  const answeredDomains = useMemo(() =>
    domainScores.filter((d) => d.answered > 0),
    [domainScores]
  );
  const unansweredDomains = useMemo(() =>
    domainScores.filter((d) => d.answered === 0),
    [domainScores]
  );

  if (!organisation || !overall) {
    return null;
  }

  // Helper: get domain name from score object
  function getDomainName(d) {
    const domain = DOMAINS.find((dom) => dom.id === d.domainId);
    return domain ? domain.name : d.domainId;
  }

  // --- Radar chart data (only answered domains) ---
  const radarLabels = answeredDomains.map((d) => {
    const name = getDomainName(d);
    if (name.length > 20) {
      return name.split(' ').reduce((lines, word) => {
        const last = lines[lines.length - 1];
        if (last && (last + ' ' + word).length <= 20) {
          lines[lines.length - 1] = last + ' ' + word;
        } else {
          lines.push(word);
        }
        return lines;
      }, []);
    }
    return name;
  });

  const radarData = {
    labels: radarLabels,
    datasets: [
      {
        label: 'Score %',
        data: answeredDomains.map((d) => Math.round(d.percentage)),
        backgroundColor: 'rgba(0, 169, 150, 0.2)',
        borderColor: '#00A996',
        borderWidth: 2,
        pointBackgroundColor: '#00A996',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, backdropColor: 'transparent', font: { size: 11 }, color: '#5A6A7A' },
        grid: { color: '#DDE2E8' },
        angleLines: { color: '#DDE2E8' },
        pointLabels: { font: { size: 11, family: 'Lato, Calibri, sans-serif' }, color: '#1C2B3A' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.raw}%` } },
    },
  };

  // --- Horizontal Bar chart data (all domains, unanswered shown as "Not assessed") ---
  const barLabels = domainScores.map((d) => getDomainName(d));

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Score %',
        data: domainScores.map((d) => d.answered > 0 ? Math.round(d.percentage) : 0),
        backgroundColor: domainScores.map((d) => getBarColor(d.percentage, d.answered)),
        borderColor: domainScores.map((d) => d.answered > 0 ? getBarColor(d.percentage, d.answered) : '#D1D5DB'),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 28,
      },
    ],
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { right: 160 }, // room for inline labels
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        ticks: { stepSize: 20, callback: (v) => `${v}%`, font: { size: 11 }, color: '#5A6A7A' },
        grid: { color: '#F0F0F0' },
      },
      y: {
        ticks: { font: { size: 12, weight: 'bold', family: 'Lato, Calibri, sans-serif' }, color: '#1C2B3A' },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const d = domainScores[ctx.dataIndex];
            if (d.answered === 0) return 'Not assessed';
            return `${ctx.raw}% — ${d.maturity.name} (${d.rawScore}/${d.maxPossible})`;
          },
        },
      },
    },
  };

  // Inline Chart.js plugin to draw percentage + maturity labels on bars
  const barDatalabelPlugin = {
    id: 'barDatalabels',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((bar, index) => {
          const d = domainScores[index];
          ctx.save();
          ctx.font = 'bold 11px Lato, Calibri, sans-serif';
          ctx.textBaseline = 'middle';

          if (d.answered === 0) {
            // Show "Not assessed" in muted text for unanswered domains
            ctx.fillStyle = '#9CA3AF';
            ctx.textAlign = 'left';
            ctx.font = 'italic 11px Lato, Calibri, sans-serif';
            ctx.fillText('Not assessed', bar.x + 10, bar.y);
          } else {
            const label = `${Math.round(d.percentage)}% — ${d.maturity.name}`;
            const textWidth = ctx.measureText(label).width;

            if (bar.x + 10 + textWidth < chart.width) {
              ctx.fillStyle = '#1C2B3A';
              ctx.textAlign = 'left';
              ctx.fillText(label, bar.x + 10, bar.y);
            } else {
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'right';
              ctx.fillText(label, bar.x - 8, bar.y);
            }
          }
          ctx.restore();
        });
      });
    },
  };

  // --- Get maturity description for a domain ---
  function getDescription(domainId, maturityName) {
    const desc = MATURITY_DESCRIPTIONS[domainId];
    if (!desc) return null;
    return desc[maturityName] || null;
  }

  // --- PDF Export ---
  function handleDownloadPDF() {
    try {
    const doc = new jsPDF();
    const exportData = getExportData();
    const date = formatDate();
    const pageW = 210;
    const margin = 20;
    const contentW = pageW - margin * 2;
    const bottomLimit = 272;

    // Helper: add page footer with page number
    function addFooter() {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(160, 160, 160);
        doc.text(`GreenOps Assessment — ${organisation.name}`, margin, 290);
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin, 290, { align: 'right' });
      }
    }

    // Helper: check if we need a page break, add one if so
    function ensureSpace(y, needed) {
      if (y + needed > bottomLimit) {
        doc.addPage();
        return 25;
      }
      return y;
    }

    // Helper: draw a section heading with teal underline
    function sectionHeading(y, title) {
      y = ensureSpace(y, 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(15, 31, 46);
      doc.text(title, margin, y);
      doc.setDrawColor(0, 169, 150);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 2, margin + contentW, y + 2);
      return y + 10;
    }

    // ========================================================================
    // PAGE 1 — Cover page
    // ========================================================================
    // Top accent bar
    doc.setFillColor(15, 31, 46);
    doc.rect(0, 0, pageW, 80, 'F');
    doc.setFillColor(0, 169, 150);
    doc.rect(0, 80, pageW, 3, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('GreenOps Organisational', 105, 38, { align: 'center' });
    doc.text('Assessment Report', 105, 52, { align: 'center' });

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 169, 150);
    doc.text('TBM Council  |  GreenOps Practice', 105, 66, { align: 'center' });

    // Organisation details card
    let y = 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 31, 46);
    doc.text(organisation.name, margin, y);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(90, 106, 122);
    const orgDetails = [
      ['Sector', organisation.sector],
      ['Size', organisation.sizeBand],
    ];
    if (organisation.region) orgDetails.push(['Region', organisation.region]);
    if (organisation.respondentName) orgDetails.push(['Respondent', organisation.respondentName]);
    orgDetails.push(['Date', date]);

    orgDetails.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 28, y);
      y += 7;
    });

    // Overall result highlight box
    y += 10;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y - 6, contentW, 42, 3, 3, 'F');
    doc.setDrawColor(0, 169, 150);
    doc.setLineWidth(0.8);
    doc.line(margin, y - 6, margin, y + 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(90, 106, 122);
    doc.text('OVERALL MATURITY', margin + 8, y + 2);

    doc.setFontSize(32);
    doc.setTextColor(0, 169, 150);
    doc.text(`${Math.round(overall.percentage)}%`, margin + 8, y + 20);

    doc.setFontSize(14);
    doc.setTextColor(15, 31, 46);
    doc.text(`Level ${overall.maturity.level}: ${overall.maturity.name}`, margin + 55, y + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 106, 122);
    doc.text(`${overall.totalRaw} / ${overall.totalMax} points`, margin + 55, y + 24);

    if (!complete) {
      y += 48;
      doc.setFontSize(9);
      doc.setTextColor(200, 120, 0);
      doc.text('Note: Assessment is partially complete. Results based on answered questions only.', margin, y);
    }

    // ========================================================================
    // PAGE 2 — About the Assessment
    // ========================================================================
    doc.addPage();
    y = 25;
    y = sectionHeading(y, 'About This Assessment');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const introParas = [
      'This report presents the results of a GreenOps maturity assessment conducted using the TBM Council\'s diagnostic framework. The assessment is designed to provide an evidence-based, structured view of how well an organisation\'s IT operations align with digital sustainability objectives.',
      'The GreenOps framework evaluates maturity across ten operational domains that together span the full scope of enterprise IT — from board-level strategy and governance through to data centres, cloud operations, AI workloads, software development, and end-user services. Each domain is scored independently, producing both a domain-level maturity rating and an overall organisational score.',
      'Maturity is measured on a five-level scale:',
    ];

    introParas.forEach((para) => {
      const lines = doc.splitTextToSize(para, contentW);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    });

    // Maturity level descriptions
    const maturityLevels = [
      { name: 'Level 1 — Initial', color: [156, 163, 175], desc: 'Little or no formal sustainability consideration in IT operations.' },
      { name: 'Level 2 — Emerging', color: [96, 165, 250], desc: 'Awareness is growing and some initiatives are underway, but practices are inconsistent.' },
      { name: 'Level 3 — Established', color: [243, 162, 97], desc: 'Structured programmes exist with defined processes, metrics, and accountability.' },
      { name: 'Level 4 — Optimised', color: [0, 169, 150], desc: 'Sustainability is embedded in decision-making with continuous improvement and clear targets.' },
      { name: 'Level 5 — Leading', color: [15, 31, 46], desc: 'Industry-leading practices with innovation, external benchmarking, and strategic influence.' },
    ];

    maturityLevels.forEach((level) => {
      doc.setFillColor(...level.color);
      doc.rect(margin + 4, y - 3, 3, 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 31, 46);
      doc.text(level.name, margin + 10, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(` — ${level.desc}`, margin + 10 + doc.getTextWidth(level.name), y);
      y += 7;
    });

    y += 4;
    const coverageIntro = 'The ten domains assessed in this report are:';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(coverageIntro, margin, y);
    y += 7;

    // Domain listing in two columns
    const domainNames = DOMAINS.map((d) => d.name);
    const col1 = domainNames.slice(0, 5);
    const col2 = domainNames.slice(5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    for (let i = 0; i < 5; i++) {
      if (col1[i]) doc.text(`${i + 1}.  ${col1[i]}`, margin + 4, y);
      if (col2[i]) doc.text(`${i + 6}.  ${col2[i]}`, margin + 90, y);
      y += 6;
    }

    y += 6;
    const methodNote = `This assessment comprises ${answeredDomains.length > 0 ? domainScores.length : 10} domains. Each question is scored from 0 (no practice) to 10 (leading practice), producing a percentage score per domain and an overall weighted maturity level. The results that follow provide domain-level scores, visual profiles, strategic insights, and structured commentary to help prioritise action.`;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const methodLines = doc.splitTextToSize(methodNote, contentW);
    doc.text(methodLines, margin, y);
    y += methodLines.length * 5 + 4;

    // ========================================================================
    // PAGE 3 — Overall Results: characteristics, strengths, priorities
    // ========================================================================
    doc.addPage();
    y = 25;
    y = sectionHeading(y, 'Overall Results');

    // Overall maturity characteristics
    const overallDesc = OVERALL_MATURITY_CHARACTERISTICS[overall.maturity.name];
    if (overallDesc) {
      doc.setFillColor(245, 247, 250);
      const descLines = doc.splitTextToSize(overallDesc, contentW - 16);
      const boxH = descLines.length * 4.5 + 10;
      doc.roundedRect(margin, y - 4, contentW, boxH, 2, 2, 'F');

      const color = overall.maturity.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.rect(margin, y - 4, 3, boxH, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(descLines, margin + 8, y + 2);
      y += boxH + 8;
    }

    // Strengths & Priority Areas
    if (topDomains.length > 0) {
      y = ensureSpace(y, 40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 31, 46);
      doc.text('Strengths & Priority Areas', margin, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 169, 150);
      doc.text('Strongest Areas', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      topDomains.forEach((d) => {
        doc.text(`•  ${getDomainName(d)} — ${Math.round(d.percentage)}% (${d.maturity.name})`, margin + 4, y);
        y += 5;
      });

      if (bottomDomains.length > 0) {
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(200, 120, 0);
        doc.text('Priority Areas', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        bottomDomains.forEach((d) => {
          doc.text(`•  ${getDomainName(d)} — ${Math.round(d.percentage)}% (${d.maturity.name})`, margin + 4, y);
          y += 5;
        });
      }
    }

    // ========================================================================
    // Charts — Bar chart + Radar on same page (or flowing into next)
    // ========================================================================
    y += 8;
    y = sectionHeading(y, 'Domain Maturity Profile');

    // Bar chart
    if (barRef.current) {
      y = ensureSpace(y, 90);
      try {
        const barImage = barRef.current.toBase64Image();
        doc.addImage(barImage, 'PNG', margin - 10, y, 190, 85);
        y += 90;
      } catch (e) { /* skip */ }
    }

    // Radar chart — if enough answered domains
    if (radarRef.current && answeredDomains.length >= 3) {
      y = ensureSpace(y, 120);
      try {
        const chartImage = radarRef.current.toBase64Image();
        doc.addImage(chartImage, 'PNG', 35, y, 140, 115);
        y += 120;
      } catch (e) { /* skip */ }
    }

    // ========================================================================
    // Strategic Insights — flows continuously
    // ========================================================================
    if (strategicInsights.length > 0) {
      y += 4;
      y = sectionHeading(y, 'Strategic Insights');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(90, 106, 122);
      doc.text('Patterns detected from your domain scores that may inform your GreenOps programme.', margin, y);
      y += 7;

      const severityColors = {
        high: [220, 38, 38],
        medium: [217, 119, 6],
        positive: [0, 169, 150],
        info: [59, 130, 246],
      };

      strategicInsights.forEach((insight) => {
        const msgLines = doc.splitTextToSize(insight.message, contentW - 10);
        const blockH = 6 + msgLines.length * 4 + 4;
        y = ensureSpace(y, blockH + 4);

        const color = severityColors[insight.severity] || severityColors.info;
        doc.setFillColor(...color);
        doc.rect(margin, y - 4, 3, blockH - 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 31, 46);
        doc.text(insight.label, margin + 6, y);
        y += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(msgLines, margin + 6, y);
        y += msgLines.length * 4 + 8;
      });
    }

    // ========================================================================
    // Recommended Next Steps — flows continuously
    // ========================================================================
    if (nextSteps) {
      y += 4;
      y = sectionHeading(y, 'Recommended Next Steps');

      const targetText = nextSteps.target
        ? `Current level: ${overall.maturity.name}  →  Target: ${nextSteps.target}`
        : `Current level: ${overall.maturity.name}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90, 106, 122);
      doc.text(targetText, margin, y);
      y += 7;

      const summaryLines = doc.splitTextToSize(nextSteps.summary, contentW);
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 4.5 + 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 31, 46);
      doc.text('Priority Actions', margin, y);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      nextSteps.actions.forEach((action, idx) => {
        const actionLines = doc.splitTextToSize(`${idx + 1}. ${action}`, contentW - 8);
        y = ensureSpace(y, actionLines.length * 4 + 4);
        doc.text(actionLines, margin + 4, y);
        y += actionLines.length * 4 + 4;
      });
    }

    // ========================================================================
    // Domain Assessment Commentary — flows continuously
    // ========================================================================
    y += 4;
    y = sectionHeading(y, 'Domain Assessment Commentary');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 106, 122);
    doc.text('Structured feedback on your current maturity level for each assessed domain.', margin, y);
    y += 8;

    answeredDomains.forEach((d) => {
      const name = getDomainName(d);
      const description = getDescription(d.domainId, d.maturity.name);
      const descLines = description ? doc.splitTextToSize(description, contentW - 10) : [];
      const blockH = 8 + (descLines.length > 0 ? descLines.length * 4 + 4 : 4);

      y = ensureSpace(y, blockH + 4);

      // Colour accent bar
      const color = d.maturity.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
      doc.rect(margin, y - 4, 3, blockH - 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 31, 46);
      doc.text(`${name}  —  Level ${d.maturity.level}: ${d.maturity.name} (${Math.round(d.percentage)}%)`, margin + 6, y);
      y += 6;

      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(descLines, margin + 6, y);
        y += descLines.length * 4 + 6;
      } else {
        y += 6;
      }
    });

    // Note unanswered domains
    if (unansweredDomains.length > 0) {
      y = ensureSpace(y, 12);
      y += 2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      const unansweredNames = unansweredDomains.map(getDomainName).join(', ');
      doc.text(`Not assessed: ${unansweredNames}`, margin, y);
      y += 8;
    }

    // ========================================================================
    // Detailed Responses — always starts a new page
    // ========================================================================
    doc.addPage();
    y = 25;
    y = sectionHeading(y, 'Detailed Responses');

    const responsesByDomain = {};
    exportData.responses.forEach((r) => {
      if (!responsesByDomain[r.domain]) responsesByDomain[r.domain] = [];
      responsesByDomain[r.domain].push(r);
    });

    let currentY = y;

    Object.entries(responsesByDomain).forEach(([domainName, responses]) => {
      if (currentY > 250) { doc.addPage(); currentY = 25; }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 31, 46);
      doc.text(domainName, margin, currentY);
      currentY += 4;

      const rows = responses.map((r) => [
        r.questionId,
        r.question,
        r.selectedOptionText || r.selectedOption || '-',
        String(r.score),
        String(r.maxScore),
      ]);

      doc.autoTable({
        startY: currentY,
        head: [['ID', 'Question', 'Selected Answer', 'Score', 'Max']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [0, 169, 150], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7, textColor: [28, 43, 58], cellPadding: 2 },
        alternateRowStyles: { fillColor: [230, 246, 244] },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 58 }, 2: { cellWidth: 62 }, 3: { cellWidth: 12, halign: 'center' }, 4: { cellWidth: 12, halign: 'center' } },
        margin: { left: margin, right: margin },
        didDrawPage: () => { currentY = 25; },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    // Add footers to all pages
    addFooter();

    doc.save(`GreenOps_Assessment_${organisation.name}_${date}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    }
  }

  // --- CSV Export ---
  function handleDownloadCSV() {
    const exportData = getExportData();
    const date = formatDate();
    const headers = ['Domain', 'Question ID', 'Question', 'Option', 'Selected Answer', 'Score', 'Max Score'];
    const rows = exportData.responses.map((r) => [
      `"${(r.domain || '').replace(/"/g, '""')}"`,
      `"${(r.questionId || '').replace(/"/g, '""')}"`,
      `"${(r.question || '').replace(/"/g, '""')}"`,
      `"${(r.selectedOption || '').replace(/"/g, '""')}"`,
      `"${(r.selectedOptionText || '').replace(/"/g, '""')}"`,
      r.score,
      r.maxScore,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, `GreenOps_Assessment_${organisation.name}_${date}.csv`, 'text/csv');
  }

  // --- JSON Export ---
  function handleDownloadJSON() {
    const exportData = getExportData();
    const date = formatDate();
    const json = JSON.stringify(exportData, null, 2);
    downloadFile(json, `GreenOps_Assessment_${organisation.name}_${date}.json`, 'application/json');
  }

  // --- Reset & navigate ---
  function handleStartNew() {
    resetAssessment();
    navigate('/');
  }

  // Overall characteristics text for the current maturity level
  const overallCharacteristics = OVERALL_MATURITY_CHARACTERISTICS[overall.maturity.name] || '';

  return (
    <div className="min-h-screen bg-content-bg">
      {/* Header */}
      <div className="bg-navy text-white px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-georgia text-3xl">{organisation.name}</h1>
          <p className="text-teal-light mt-1 text-sm tracking-wide">
            GreenOps Organisational Assessment Results
          </p>
        </div>
      </div>

      {/* Incomplete warning */}
      {!complete && (
        <div className="bg-orange-light border-l-4 border-orange px-6 py-3">
          <div className="max-w-5xl mx-auto text-sm text-body-text">
            <span className="font-bold">Assessment is partially complete.</span>{' '}
            Results shown are based on answered questions only.
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ===== Overall Maturity Summary Card ===== */}
        <div className="bg-white rounded-lg border border-card-border p-8">
          <p className="section-label text-xs mb-4">Overall Maturity</p>

          {/* Score headline */}
          <div className="flex items-center gap-6 flex-wrap mb-6">
            <span className="text-5xl font-bold text-teal">
              {Math.round(overall.percentage)}%
            </span>
            <span
              className="px-4 py-2 rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: overall.maturity.color }}
            >
              Level {overall.maturity.level} — {overall.maturity.name}
            </span>
            <span className="text-muted-text text-sm">
              {overall.totalRaw} / {overall.totalMax}
            </span>
          </div>

          {/* Overall characteristics description */}
          {overallCharacteristics && (
            <div
              className="rounded-lg p-5 mb-8 border-l-4 bg-gray-50"
              style={{ borderLeftColor: overall.maturity.color }}
            >
              <p className="text-sm text-body-text leading-relaxed">
                {overallCharacteristics}
              </p>
            </div>
          )}

          {/* Strengths & Priority Areas — show strengths even without priorities */}
          {topDomains.length > 0 && (
            <div>
              <h3 className="font-georgia text-lg text-navy mb-4">Strengths &amp; Priority Areas</h3>
              <div className={`grid ${bottomDomains.length > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
                {/* Strongest */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-sm text-navy">Strongest Areas</span>
                  </div>
                  <div className="space-y-2">
                    {topDomains.map((d) => (
                      <div key={d.domainId} className="flex items-center justify-between bg-teal/5 rounded-lg px-4 py-2.5 border border-teal/20">
                        <span className="text-sm font-bold text-navy">{getDomainName(d)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-teal">{Math.round(d.percentage)}%</span>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded text-white"
                            style={{ backgroundColor: d.maturity.color }}
                          >
                            {d.maturity.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority areas — only if enough answered domains */}
                {bottomDomains.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-bold text-sm text-navy">Priority Areas</span>
                    </div>
                    <div className="space-y-2">
                      {bottomDomains.map((d) => (
                        <div key={d.domainId} className="flex items-center justify-between bg-orange/5 rounded-lg px-4 py-2.5 border border-orange/20">
                          <span className="text-sm font-bold text-navy">{getDomainName(d)}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-orange">{Math.round(d.percentage)}%</span>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded text-white"
                              style={{ backgroundColor: d.maturity.color }}
                            >
                              {d.maturity.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ===== Strategic Insights ===== */}
        {strategicInsights.length > 0 && (
          <div className="bg-white rounded-lg border border-card-border p-6">
            <h2 className="font-georgia text-xl text-navy mb-2">Strategic Insights</h2>
            <p className="text-sm text-muted-text mb-5">
              Patterns detected from your domain scores that may inform your GreenOps programme.
            </p>
            <div className="space-y-4">
              {strategicInsights.map((insight) => {
                const style = INSIGHT_STYLES[insight.severity] || INSIGHT_STYLES.info;
                return (
                  <div
                    key={insight.id}
                    className={`rounded-lg border-l-4 ${style.border} ${style.bg} p-5`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`${style.iconColor} mt-0.5`}>
                        <InsightIcon type={insight.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-sm text-navy">{insight.label}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${style.label}`}>
                            {insight.severity === 'high' ? 'High Priority' :
                             insight.severity === 'medium' ? 'Moderate' :
                             insight.severity === 'positive' ? 'Strength' : 'Insight'}
                          </span>
                        </div>
                        <p className="text-sm text-body-text leading-relaxed">{insight.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== Recommended Next Steps ===== */}
        {nextSteps && (
          <div className="bg-white rounded-lg border border-card-border p-6">
            <h2 className="font-georgia text-xl text-navy mb-2">Recommended Next Steps</h2>
            <p className="text-sm text-muted-text mb-5">
              {nextSteps.target ? (
                <>Priority actions to progress from <strong>{overall.maturity.name}</strong> towards <strong>{nextSteps.target}</strong> maturity.</>
              ) : (
                <>Priorities for maintaining <strong>{overall.maturity.name}</strong> performance and driving continuous improvement.</>
              )}
            </p>

            {/* Summary */}
            <div
              className="rounded-lg p-4 mb-5 border-l-4 bg-gray-50"
              style={{ borderLeftColor: overall.maturity.color }}
            >
              <p className="text-sm text-body-text leading-relaxed">{nextSteps.summary}</p>
            </div>

            {/* Actions list */}
            <div className="space-y-3">
              {nextSteps.actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: overall.maturity.color }}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-sm text-body-text leading-relaxed pt-1">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== Horizontal Bar Chart (with inline labels) ===== */}
        <div className="bg-white rounded-lg border border-card-border p-6">
          <h2 className="font-georgia text-xl text-navy mb-4">Domain Maturity</h2>
          <div style={{ height: `${Math.max(domainScores.length * 48, 380)}px` }}>
            <Bar ref={barRef} data={barData} options={barOptions} plugins={[barDatalabelPlugin]} />
          </div>
        </div>

        {/* ===== Radar Chart (only answered domains) ===== */}
        {answeredDomains.length >= 3 && (
          <div className="bg-white rounded-lg border border-card-border p-6">
            <h2 className="font-georgia text-xl text-navy mb-4">Maturity Profile</h2>
            <div className="max-w-2xl mx-auto">
              <Radar ref={radarRef} data={radarData} options={radarOptions} />
            </div>
            {unansweredDomains.length > 0 && (
              <p className="text-xs text-muted-text text-center mt-3">
                Note: {unansweredDomains.length} unanswered domain{unansweredDomains.length > 1 ? 's' : ''} excluded from radar chart.
              </p>
            )}
          </div>
        )}

        {/* ===== Domain Commentary — colour-coded by maturity level ===== */}
        <div className="bg-white rounded-lg border border-card-border p-6">
          <h2 className="font-georgia text-xl text-navy mb-2">Assessment Commentary</h2>
          <p className="text-sm text-muted-text mb-6">
            Structured feedback on your current maturity level for each assessed domain.
          </p>
          <div className="space-y-5">
            {answeredDomains.map((d) => {
              const name = getDomainName(d);
              const description = getDescription(d.domainId, d.maturity.name);

              return (
                <div key={d.domainId} className="border border-card-border rounded-lg overflow-hidden">
                  {/* Colour-coded header: left accent bar + tinted background */}
                  <div
                    className="px-5 py-3 flex items-center justify-between border-l-4"
                    style={{
                      borderLeftColor: d.maturity.color,
                      backgroundColor: `${d.maturity.color}10`,
                    }}
                  >
                    <h3 className="text-navy font-bold text-sm">{name}</h3>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-3 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: d.maturity.color }}
                      >
                        Level {d.maturity.level} — {d.maturity.name}
                      </span>
                      <span className="text-navy text-sm font-bold">
                        {Math.round(d.percentage)}%
                      </span>
                    </div>
                  </div>
                  {/* Description */}
                  <div className="px-5 py-4">
                    {description ? (
                      <p className="text-sm text-body-text leading-relaxed">{description}</p>
                    ) : (
                      <p className="text-sm text-muted-text italic">No commentary available for this level.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note about unanswered domains */}
          {unansweredDomains.length > 0 && (
            <div className="mt-5 rounded-lg bg-gray-50 border border-gray-200 px-5 py-3">
              <p className="text-sm text-muted-text">
                <span className="font-bold">Not yet assessed:</span>{' '}
                {unansweredDomains.map(getDomainName).join(', ')}.{' '}
                <button
                  onClick={() => navigate('/assess')}
                  className="text-teal hover:text-teal-dark font-bold"
                >
                  Return to assessment &rarr;
                </button>
              </p>
            </div>
          )}
        </div>

        {/* ===== Export Section ===== */}
        <div className="bg-white rounded-lg border border-card-border p-6">
          <h2 className="font-georgia text-xl text-navy mb-4">Export Results</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-teal text-white font-bold rounded-lg hover:bg-teal-dark transition-colors"
            >
              Download PDF Report
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-6 py-3 border-2 border-teal text-teal font-bold rounded-lg hover:bg-teal-light transition-colors"
            >
              Download CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-6 py-3 border-2 border-teal text-teal font-bold rounded-lg hover:bg-teal-light transition-colors"
            >
              Download JSON
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 pb-8">
          <button
            onClick={() => navigate('/assess')}
            className="text-teal hover:text-teal-dark font-bold transition-colors"
          >
            &larr; Back to Assessment
          </button>
          <button
            onClick={handleStartNew}
            className="px-6 py-3 border-2 border-navy text-navy font-bold rounded-lg hover:bg-navy hover:text-white transition-colors"
          >
            Start New Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
