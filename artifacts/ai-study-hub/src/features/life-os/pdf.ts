import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { LifeOsState, RoutineBlock } from "./types";
import {
  activityBreakdown,
  analyze,
  computeDailyStats,
  fmtDuration,
  todayKey,
  toolInteractions,
  toolMinutesOn,
} from "./engine";

/* ═══════════════════════════════════════════════════
   PROFESSIONAL PDF DAILY REPORT — jsPDF + autoTable
   Clean typography, no emojis, exportable to the
   school / parent / student archive.
   ═══════════════════════════════════════════════════ */

const ORANGE: [number, number, number] = [255, 159, 76];
const ORANGE_DEEP: [number, number, number] = [232, 133, 46];
const TEXT: [number, number, number] = [45, 45, 45];
const MUTED: [number, number, number] = [122, 106, 88];
const FILL: [number, number, number] = [255, 244, 232];
const LINE: [number, number, number] = [235, 216, 192];
const GREEN: [number, number, number] = [78, 156, 111];

const M = 14; // page margin
const W = 210 - M * 2; // usable width (A4)

const blockTypeLabel = (b: RoutineBlock): string => {
  switch (b.type) {
    case "study": return "Study";
    case "mission": return "Mission";
    case "review": return "Review";
    case "break": return "Break";
    case "meal": return "Meal";
    case "sleep": return "Sleep";
    case "wake": return "Wake";
    case "school": return "School";
    case "coaching": return "Coaching";
    case "travel": return "Travel";
    case "exercise": return "Exercise";
    case "prayer": return "Prayer";
    case "leisure": return "Leisure";
    default: return b.type;
  }
};

const fmtTime = (min: number): string => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const dateLabel = (): string =>
  new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

function sectionTitle(doc: jsPDF, y: number, no: string, title: string): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ORANGE_DEEP);
  doc.text(`${no}  ${title}`, M, y);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.4);
  doc.line(M, y + 2.4, W + M, y + 2.4);
  return y + 8;
}

function kvCell(doc: jsPDF, x: number, y: number, w: number, label: string, value: string): void {
  doc.setFillColor(...FILL);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, 17, 2.5, 2.5, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), x + 6, y + 6.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...TEXT);
  doc.text(value, x + 6, y + 13);
}

function buildReportData(state: LifeOsState) {
  const profile = state.profile;
  const today = todayKey();
  if (!profile) return null;
  const live = computeDailyStats(state.routine, profile);
  const stored = state.dailyStats[today];
  const studyMin = Math.max(live.studyMin, stored?.studyMin ?? 0, toolMinutesOn(state, today));
  const completion = Math.max(live.completion, stored?.completion ?? 0);
  const xp = Math.max(live.xp, stored?.xp ?? 0);
  const focus = Math.max(live.focus, stored?.focus ?? 0);
  const analysis = analyze(profile);
  const breakdown = activityBreakdown(state);
  const interactions = toolInteractions(state, today);
  const study = state.routine.filter((b) => b.type === "study" || b.type === "mission");
  const done = study.filter((b) => b.status === "done" || b.status === "adapted").length;
  const firstUp = [...state.routine]
    .filter((b) => (b.type === "study" || b.type === "mission") && b.status === "pending")
    .sort((a, b) => a.startMin - b.startMin)[0];
  return { profile, today, studyMin, completion, xp, focus, analysis, breakdown, interactions, study, done, firstUp };
}

function drawFooter(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `StudyOS Daily Progress Report — generated ${new Date().toLocaleString()}`,
      M,
      292
    );
    doc.text(`Page ${i} of ${pages}`, W + M, 292, { align: "right" });
  }
}

/** Build and download the professional daily report PDF. */
export function downloadDailyReportPdf(state: LifeOsState): void {
  const data = buildReportData(state);
  if (!data) return;
  const { profile, today, studyMin, completion, xp, focus, analysis, breakdown, interactions, study, done, firstUp } = data;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  // header band
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 210, 26, "F");
  doc.setFillColor(...ORANGE_DEEP);
  doc.rect(0, 26, 210, 1.4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("STUDYOS", M, 13);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.text("Daily Progress Report", 34, 13);
  doc.setFontSize(8);
  doc.setTextColor(255, 235, 214);
  doc.text(dateLabel(), W + M, 13, { align: "right" });

  y = 34;

  // student identity
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...TEXT);
  doc.text(`${profile.name}`, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Grade ${profile.grade}  |  ${profile.country}  |  Wake ${profile.wakeTime} - Sleep ${profile.sleepTime}`,
    M,
    y
  );
  y += 8;

  // 1. STUDY SUMMARY
  y = sectionTitle(doc, y, "1.", "STUDY SUMMARY");
  const cardW = (W - 6) / 3;
  kvCell(doc, M, y, cardW, "Study Time", fmtDuration(studyMin));
  kvCell(doc, M + cardW + 3, y, cardW, "Plan Completion", `${completion}%`);
  kvCell(doc, M + (cardW + 3) * 2, y, cardW, "Blocks Done", `${done}/${study.length}`);
  y += 21;
  kvCell(doc, M, y, cardW, "XP Earned", `+${xp}`);
  kvCell(doc, M + cardW + 3, y, cardW, "Focus Score", `${focus}/100`);
  kvCell(doc, M + (cardW + 3) * 2, y, cardW, "Streak", `${state.gamification.streak} day${state.gamification.streak === 1 ? "" : "s"}`);
  y += 26;

  // 2. TODAY'S TIMETABLE
  y = sectionTitle(doc, y, "2.", "TODAY'S TIMETABLE");
  const blocks = [...state.routine]
    .filter((b) => b.type === "study" || b.type === "mission" || b.type === "review")
    .sort((a, b) => a.startMin - b.startMin);
  if (blocks.length) {
    autoTable(doc, {
      startY: y + 1,
      margin: { left: M, right: M },
      head: [["Time", "Activity", "Subject", "Focus", "Status"]],
      body: blocks.map((b) => [
        `${fmtTime(b.startMin)} - ${fmtTime(b.endMin)}`,
        blockTypeLabel(b),
        b.subject ?? "—",
        b.focus === "deep" ? "Deep" : "Light",
        b.status === "done" ? "Done" : b.status === "adapted" ? "Adapted" : b.status === "skipped" ? "Skipped" : "Pending",
      ]),
      theme: "grid",
      headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 2.4 },
      bodyStyles: { fontSize: 8, textColor: TEXT, lineColor: LINE, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: FILL },
      columnStyles: {
        0: { cellWidth: 34 },
        1: { cellWidth: 22 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No study blocks scheduled today.", M, y);
    y += 8;
  }

  // 3. TOOL USAGE
  y = sectionTitle(doc, y, "3.", "TOOL USAGE");
  const tools = breakdown.today.length ? breakdown.today : breakdown.week;
  if (tools.length) {
    autoTable(doc, {
      startY: y + 1,
      margin: { left: M, right: M },
      head: [["Tool", "Minutes", "Visits", "XP"]],
      body: tools.map((t) => [t.toolName, fmtDuration(t.minutes), String(t.visits), String(t.xp)]),
      theme: "grid",
      headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 2.4 },
      bodyStyles: { fontSize: 8, textColor: TEXT, lineColor: LINE, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: FILL },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 30 }, 2: { cellWidth: 24 }, 3: { cellWidth: 24 } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No tool usage recorded yet.", M, y);
    y += 8;
  }

  // 4. SEARCHES AND RESULTS
  y = sectionTitle(doc, y, "4.", "SEARCHES AND RESULTS");
  if (interactions.length) {
    const rows = interactions.slice(0, 14).map((it) => [
      it.toolName,
      it.query ?? "—",
      it.result ?? "—",
    ]);
    autoTable(doc, {
      startY: y + 1,
      margin: { left: M, right: M },
      head: [["Tool", "What was asked / input", "Result received"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: ORANGE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8, cellPadding: 2.4 },
      bodyStyles: { fontSize: 7.5, textColor: TEXT, lineColor: LINE, lineWidth: 0.2 },
      alternateRowStyles: { fillColor: FILL },
      columnStyles: { 0: { cellWidth: 30 }, 1: { cellWidth: 76 }, 2: { cellWidth: 76 } },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("No searches recorded yet today.", M, y);
    y += 8;
  }

  // 5. ACADEMIC OUTLOOK
  y = sectionTitle(doc, y, "5.", "ACADEMIC OUTLOOK");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TEXT);
  const outlook = [
    `Predicted exam score: ${analysis.predictedScore}%`,
    `Weakest subject to prioritise: ${analysis.weakestSubject}`,
    analysis.nextExam ? `Next exam: ${analysis.nextExam.subject} in ${analysis.nextExam.days} day${analysis.nextExam.days === 1 ? "" : "s"}` : "No upcoming exam scheduled.",
    firstUp ? `Next study block: ${firstUp.subject} at ${fmtTime(firstUp.startMin)} (${fmtDuration(firstUp.endMin - firstUp.startMin)})` : "No pending study blocks.",
  ];
  outlook.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, W);
    doc.text(wrapped, M, y);
    y += wrapped.length * 4.6 + 1.4;
  });

  y += 2;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(M, y, W + M, y);
  y += 7;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  const closing = doc.splitTextToSize(
    completion >= 80
      ? "Outstanding day. Maintain this momentum tomorrow."
      : completion >= 40
      ? "Solid progress. A few more blocks will complete the day."
      : "Every session counts. Start small, one block at a time.",
    W
  );
  doc.text(closing, M, y);

  drawFooter(doc);
  doc.save(`StudyOS-Daily-Report-${today}.pdf`);
}
