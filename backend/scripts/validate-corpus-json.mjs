import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(await readFile(join(backendRoot, 'corpus-catalog.json'), 'utf8'));
const sentenceCount = (text) => String(text ?? '').split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length;

let valid = 0;
let thin = 0;
let missing = 0;
let skipped = 0;

for (const chapter of catalog.sort((a, b) => a.id - b.id)) {
  const label = `${String(chapter.id).padStart(3, '0')} ${chapter.subject} — ${chapter.name}`;
  if (chapter.skipReason) {
    skipped += 1;
    console.log(`— skipped (PYQ-only): ${label}`);
    continue;
  }

  const filePath = join(backendRoot, chapter.expectedPath);
  let parsed;
  try {
    parsed = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    missing += 1;
    const suffix = error.code === 'ENOENT' ? 'missing' : 'invalid JSON';
    console.log(`✗ ${suffix}: ${label} (${chapter.expectedPath})`);
    continue;
  }

  // Accept both the original corpus shape and the externally generated qna shape
  // that BirBal's tolerant importer normalizes.
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
    : Array.isArray(parsed.qna)
      ? parsed.qna
      : [];
  const averageAnswerSentences = questions.length === 0
    ? 0
    : questions.reduce((sum, question) => sum + sentenceCount(question.answer ?? question.response ?? question.explanation), 0) / questions.length;
  if (questions.length < 35 || averageAnswerSentences < 3) {
    thin += 1;
    console.log(`⚠ found but thin: ${label} (${questions.length} questions; ${averageAnswerSentences.toFixed(1)} avg answer sentences)`);
  } else {
    valid += 1;
    console.log(`✓ found and valid: ${label} (${questions.length} questions; ${averageAnswerSentences.toFixed(1)} avg answer sentences)`);
  }
}

console.log(`\nSummary: ${valid} valid, ${thin} thin, ${missing} missing/invalid, ${skipped} PYQ-only skipped.`);
process.exitCode = missing > 0 || thin > 0 ? 1 : 0;
