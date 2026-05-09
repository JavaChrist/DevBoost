// Helpers pour les cours : validation, sync depuis les seeds JSON, progression.

export function validateCourse(course) {
  const errors = [];
  if (!course || typeof course !== 'object') return { ok: false, errors: ['cours invalide'] };
  if (!course.slug) errors.push('slug manquant');
  if (!course.theme) errors.push('theme manquant');
  if (!course.title) errors.push('title manquant');
  if (!Array.isArray(course.sections) || course.sections.length === 0)
    errors.push('au moins une section requise');
  else {
    course.sections.forEach((s, i) => {
      if (!s.heading) errors.push(`section ${i + 1} : heading manquant`);
      if (!s.body) errors.push(`section ${i + 1} : body manquant`);
      if (s.code && (!s.code.value || typeof s.code.value !== 'string'))
        errors.push(`section ${i + 1} : code.value invalide`);
    });
  }
  if (course.quiz) {
    if (!Array.isArray(course.quiz)) errors.push('quiz doit être un tableau');
    else {
      course.quiz.forEach((q, i) => {
        if (!q.question) errors.push(`quiz ${i + 1} : question manquante`);
        if (!Array.isArray(q.choices) || q.choices.length < 2)
          errors.push(`quiz ${i + 1} : au moins 2 choix`);
        const a = Number(q.answer);
        if (!Number.isInteger(a) || a < 0 || (Array.isArray(q.choices) && a >= q.choices.length))
          errors.push(`quiz ${i + 1} : answer invalide`);
      });
    }
  }
  return { ok: errors.length === 0, errors };
}

// Champs réinjectés depuis le seed (le contenu peut évoluer entre 2 builds),
// sans toucher au progress utilisateur.
const COURSE_CONTENT = ['theme', 'title', 'summary', 'level', 'sections', 'quiz'];

function pickContent(course) {
  const out = {};
  for (const k of COURSE_CONTENT) if (course[k] !== undefined) out[k] = course[k];
  return out;
}

// Synchronise les cours seed dans Dexie : update si même slug, add sinon.
// La table `courseProgress` (gérée à part) n'est pas touchée.
export async function syncCourses(db, seedCourses) {
  const existing = await db.courses.toArray();
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  let added = 0;
  let updated = 0;

  await db.transaction('rw', db.courses, async () => {
    for (const c of seedCourses) {
      const v = validateCourse(c);
      if (!v.ok) continue;
      const dbCourse = bySlug.get(c.slug);
      if (dbCourse) {
        await db.courses.update(dbCourse.id, pickContent(c));
        updated++;
      } else {
        await db.courses.add({ slug: c.slug, ...pickContent(c) });
        added++;
      }
    }
  });

  return { added, updated };
}

// Progression : { slug, lastSection, completed, completedAt }
export async function getProgress(db, slug) {
  return (await db.courseProgress.get(slug)) ?? null;
}

export async function setLastSection(db, slug, lastSection) {
  const existing = await db.courseProgress.get(slug);
  await db.courseProgress.put({
    ...(existing ?? { slug, completed: false, completedAt: null }),
    lastSection,
  });
}

export async function markCompleted(db, slug) {
  await db.courseProgress.put({
    slug,
    lastSection: -1,
    completed: true,
    completedAt: new Date().toISOString(),
  });
}

// Pourcentage 0..100 — sections vues + bonus 20% si quiz validé.
export function progressPercent(course, progress) {
  if (!course || !course.sections?.length) return 0;
  if (progress?.completed) return 100;
  const last = progress?.lastSection ?? -1;
  if (last < 0) return 0;
  const sectionsRatio = (last + 1) / course.sections.length;
  return Math.min(99, Math.round(sectionsRatio * 80));
}
