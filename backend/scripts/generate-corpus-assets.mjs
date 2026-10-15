import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const subjectPrefixes = { Physics: 'PHY', Chemistry: 'CHE', Mathematics: 'MAT' };

// `resourceId: null` means that the current resource catalogue has no NOTES or
// SHORT_NOTES PDF for the chapter. A prompt is still created as a clearly
// flagged placeholder; do not generate its corpus until a source is attached.
const chapters = [
  { id: 1, subject: 'Physics', name: 'Motion in a Plane', prefix: 'MIP', resourceId: 153, resourceType: 'SHORT_NOTES' },
  { id: 2, subject: 'Physics', name: 'Laws of Motion', prefix: 'LOM', resourceId: 154, resourceType: 'NOTES' },
  { id: 3, subject: 'Physics', name: 'Gravitation', prefix: 'GRAV', resourceId: 156, resourceType: 'NOTES' },
  { id: 4, subject: 'Physics', name: 'Thermal Properties of Matter', prefix: 'TPM', resourceId: 158, resourceType: 'NOTES' },
  { id: 5, subject: 'Physics', name: 'Sound', prefix: 'SND', resourceId: 160, resourceType: 'NOTES' },
  { id: 6, subject: 'Physics', name: 'Optics', prefix: 'OPT', skipReason: 'PYQ-only (resource 161); question papers are not corpus sources.' },
  { id: 7, subject: 'Physics', name: 'Electrostatics', prefix: 'ELS', resourceId: 162, resourceType: 'NOTES' },
  { id: 8, subject: 'Physics', name: 'Semiconductors', prefix: 'SEM', resourceId: null },
  { id: 9, subject: 'Physics', name: 'Circular Motion', prefix: 'CM', resourceId: 164, resourceType: 'NOTES' },
  { id: 10, subject: 'Physics', name: 'Rotational Motion', prefix: 'RM', resourceId: null },
  { id: 11, subject: 'Physics', name: 'Oscillations', prefix: 'OSC', resourceId: 166, resourceType: 'NOTES' },
  { id: 12, subject: 'Physics', name: 'Wave Motion', prefix: 'WM', resourceId: 168, resourceType: 'NOTES' },
  { id: 13, subject: 'Physics', name: 'Magnetic Effects of Electric Current', prefix: 'MEEC', resourceId: 169, resourceType: 'NOTES' },
  { id: 14, subject: 'Physics', name: 'Electromagnetic Induction', prefix: 'EMI', resourceId: 171, resourceType: 'NOTES' },
  { id: 15, subject: 'Physics', name: 'Electrons and Photons', prefix: 'EAP', resourceId: null },
  { id: 16, subject: 'Physics', name: 'Dual Nature of Radiation and Matter', prefix: 'DNRM', resourceId: 172, resourceType: 'NOTES' },
  { id: 17, subject: 'Physics', name: 'Kinetic Theory of Gases and Radiation', prefix: 'KTGR', resourceId: 174, resourceType: 'SHORT_NOTES' },
  { id: 18, subject: 'Physics', name: 'Wave Optics', prefix: 'WO', resourceId: 175, resourceType: 'NOTES' },
  { id: 19, subject: 'Physics', name: 'Mechanical Properties of Fluids', prefix: 'MPF', resourceId: 177, resourceType: 'NOTES' },
  { id: 20, subject: 'Chemistry', name: 'Structure of Atom', prefix: 'SOA', resourceId: 179, resourceType: 'NOTES' },
  { id: 21, subject: 'Chemistry', name: 'Chemical Bonding', prefix: 'CB', resourceId: 180, resourceType: 'SHORT_NOTES' },
  { id: 22, subject: 'Chemistry', name: 'Redox Reactions', prefix: 'RR', resourceId: null },
  { id: 23, subject: 'Chemistry', name: 's-Block Elements', prefix: 'SB', resourceId: 181, resourceType: 'SHORT_NOTES' },
  { id: 24, subject: 'Chemistry', name: 'd and f block Elements', prefix: 'DFBE', resourceId: 182, resourceType: 'SHORT_NOTES' },
  { id: 25, subject: 'Chemistry', name: 'States of Matter (Gases and Liquids)', prefix: 'SM', resourceId: null },
  { id: 26, subject: 'Chemistry', name: 'Surface Chemistry', prefix: 'SC', resourceId: null },
  { id: 27, subject: 'Chemistry', name: 'Hydrocarbons', prefix: 'HYD', resourceId: 183, resourceType: 'NOTES' },
  { id: 28, subject: 'Chemistry', name: 'Basic Principles of Organic Chemistry', prefix: 'BPOC', resourceId: 184, resourceType: 'NOTES' },
  { id: 29, subject: 'Chemistry', name: 'Chemistry in Everyday Life', prefix: 'CEIL', resourceId: 185, resourceType: 'NOTES' },
  { id: 30, subject: 'Chemistry', name: 'Solid State', prefix: 'SS', resourceId: null },
  { id: 31, subject: 'Chemistry', name: 'Thermodynamics', prefix: 'THC', resourceId: 186, resourceType: 'SHORT_NOTES' },
  { id: 32, subject: 'Chemistry', name: 'Electrochemistry', prefix: 'ELC', resourceId: null },
  { id: 33, subject: 'Chemistry', name: 'p-Block Elements', prefix: 'PB', resourceId: null },
  { id: 34, subject: 'Chemistry', name: 'd and f Block Elements', prefix: 'DFE', resourceId: null },
  { id: 35, subject: 'Chemistry', name: 'Chemical Kinetics', prefix: 'CK', resourceId: 187, resourceType: 'SHORT_NOTES' },
  { id: 36, subject: 'Chemistry', name: 'Halogen Derivatives of Alkanes and Arenes', prefix: 'HDAA', resourceId: null },
  { id: 37, subject: 'Chemistry', name: 'Aldehydes Ketones and Carboxylic Acids', prefix: 'AKCA', resourceId: 188, resourceType: 'SHORT_NOTES' },
  { id: 38, subject: 'Chemistry', name: 'Amines', prefix: 'AMN', resourceId: 189, resourceType: 'SHORT_NOTES' },
  { id: 39, subject: 'Chemistry', name: 'Alcohols Phenols and Ethers', prefix: 'APE', resourceId: null },
  { id: 40, subject: 'Chemistry', name: 'Polymers', prefix: 'POL', resourceId: 190, resourceType: 'SHORT_NOTES' },
  { id: 41, subject: 'Mathematics', name: 'Trigonometry II', prefix: 'TII', resourceId: 191, resourceType: 'SHORT_NOTES' },
  { id: 42, subject: 'Mathematics', name: 'Straight Line', prefix: 'SL', resourceId: null },
  { id: 43, subject: 'Mathematics', name: 'Circle', prefix: 'CIR', resourceId: 192, resourceType: 'SHORT_NOTES' },
  { id: 44, subject: 'Mathematics', name: 'Measures of Dispersion', prefix: 'MOD', resourceId: 193, resourceType: 'SHORT_NOTES' },
  { id: 45, subject: 'Mathematics', name: 'Complex Numbers', prefix: 'CN', resourceId: 194, resourceType: 'SHORT_NOTES' },
  { id: 46, subject: 'Mathematics', name: 'Permutations and Combinations', prefix: 'PAC', resourceId: 195, resourceType: 'SHORT_NOTES' },
  { id: 47, subject: 'Mathematics', name: 'Limits', prefix: 'LIM', resourceId: 196, resourceType: 'SHORT_NOTES' },
  { id: 48, subject: 'Mathematics', name: 'Continuity', prefix: 'CON', resourceId: 197, resourceType: 'SHORT_NOTES' },
  { id: 49, subject: 'Mathematics', name: 'Matrices', prefix: 'MTR', resourceId: 198, resourceType: 'SHORT_NOTES' },
  { id: 50, subject: 'Mathematics', name: 'Pair of Straight Lines', prefix: 'PSL', resourceId: 199, resourceType: 'SHORT_NOTES' },
  { id: 51, subject: 'Mathematics', name: 'Trigonometric Functions', prefix: 'TF', resourceId: 200, resourceType: 'SHORT_NOTES' },
  { id: 52, subject: 'Mathematics', name: 'Vectors', prefix: 'VEC', resourceId: 201, resourceType: 'SHORT_NOTES' },
  { id: 53, subject: 'Mathematics', name: 'Line and Plane', prefix: 'LAP', resourceId: 202, resourceType: 'SHORT_NOTES' },
  { id: 54, subject: 'Mathematics', name: 'Applications of Derivatives', prefix: 'AOD', resourceId: 203, resourceType: 'SHORT_NOTES' },
  { id: 55, subject: 'Mathematics', name: 'Indefinite Integration', prefix: 'II', resourceId: 204, resourceType: 'NOTES' },
  { id: 56, subject: 'Mathematics', name: 'Differentiation', prefix: 'DIF', resourceId: 207, resourceType: 'SHORT_NOTES' },
  { id: 57, subject: 'Mathematics', name: 'Applications of Definite Integral', prefix: 'ADI', resourceId: 208, resourceType: 'SHORT_NOTES' },
  { id: 58, subject: 'Mathematics', name: 'Differential Equations', prefix: 'DE', resourceId: 209, resourceType: 'SHORT_NOTES' },
  { id: 59, subject: 'Mathematics', name: 'Probability', prefix: 'PRO', resourceId: 210, resourceType: 'SHORT_NOTES' },
  { id: 60, subject: 'Physics', name: 'AC Circuits', prefix: 'ACC', resourceId: 211, resourceType: 'SHORT_NOTES' },
  { id: 61, subject: 'Physics', name: 'Thermodynamics', prefix: 'THP', resourceId: 212, resourceType: 'SHORT_NOTES' },
  { id: 62, subject: 'Physics', name: 'Superposition of Waves', prefix: 'SOW', resourceId: 213, resourceType: 'SHORT_NOTES' },
  { id: 63, subject: 'Mathematics', name: 'Definite Integration', prefix: 'DI', resourceId: 206, resourceType: 'SHORT_NOTES' },
];

const slugify = (value) => value
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

function outputName(chapter) {
  return `${subjectPrefixes[chapter.subject]}_${String(chapter.id).padStart(3, '0')}_${slugify(chapter.name)}.json`;
}

function promptFor(chapter) {
  const outputFileName = outputName(chapter);
  const sourceComment = chapter.resourceId === null
    ? '# Source resource: NONE — no NOTES or SHORT_NOTES resource is currently attached. Do not generate JSON until one exists.'
    : `# Source resource: ${chapter.resourceId} (${chapter.resourceType})`;

  return `${sourceComment}\n# Expected output: corpus-json/${chapter.subject}/${outputFileName}\n# This prompt is generated. Keep the identifiers unchanged.\n\nYou are creating the Master CET Sheet study corpus for one chapter. Use only the selected source PDF. Do not invent facts that are absent from it.\n\nchapterId: ${chapter.id}\nchapterName: ${chapter.name}\nsubject: ${chapter.subject}\noutputFileName: ${outputFileName}\nconceptIdPrefix: ${chapter.prefix}\n\nReturn one valid JSON object, with no Markdown fence, matching this shape:\n{\n  \"schemaVersion\": 1,\n  \"chapterId\": ${chapter.id},\n  \"chapterName\": \"${chapter.name}\",\n  \"subject\": \"${chapter.subject}\",\n  \"conceptIdPrefix\": \"${chapter.prefix}\",\n  \"questions\": [\n    {\n      \"id\": \"${chapter.prefix}-Q001\",\n      \"question\": \"...\",\n      \"answer\": \"At least three complete sentences.\",\n      \"concepts\": [\"...\"]\n    }\n  ]\n}\n\nQuality requirements:\n- Create at least 35 meaningful questions that cover definitions, reasoning, formulae where relevant, common mistakes, and CET-style application.\n- Give each answer at least three complete sentences; explain the reasoning rather than only stating a result.\n- IDs must begin with ${chapter.prefix}- and be unique within this file.\n- Preserve the chapter metadata exactly as above.\n- Save the JSON to corpus-json/${chapter.subject}/${outputFileName}.\n`;
}

const seenPrefixes = new Set();
for (const chapter of chapters) {
  if (seenPrefixes.has(chapter.prefix)) throw new Error(`Duplicate concept prefix: ${chapter.prefix}`);
  seenPrefixes.add(chapter.prefix);
}

for (const subject of Object.keys(subjectPrefixes)) {
  await mkdir(join(backendRoot, 'corpus-prompts', subject), { recursive: true });
  await mkdir(join(backendRoot, 'corpus-json', subject), { recursive: true });
  await writeFile(join(backendRoot, 'corpus-json', subject, '.gitkeep'), '');
}

for (const chapter of chapters) {
  if (chapter.skipReason) continue;
  const promptName = outputName(chapter).replace(/\.json$/, '.txt');
  await writeFile(join(backendRoot, 'corpus-prompts', chapter.subject, promptName), promptFor(chapter));
}

await writeFile(join(backendRoot, 'corpus-catalog.json'), `${JSON.stringify(chapters.map((chapter) => ({
  ...chapter,
  outputFileName: outputName(chapter),
  expectedPath: `corpus-json/${chapter.subject}/${outputName(chapter)}`,
})), null, 2)}\n`);

const sourceReady = chapters.filter((chapter) => chapter.resourceId).length;
const sourceMissing = chapters.filter((chapter) => chapter.resourceId === null && !chapter.skipReason).length;
console.log(`Created ${chapters.length - 1} prompts: ${sourceReady} source-ready, ${sourceMissing} waiting for a source; skipped 1 PYQ-only chapter.`);
