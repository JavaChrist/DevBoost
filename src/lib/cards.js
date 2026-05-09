// Helpers pour les cartes : defaults SM-2, validation, normalisation, export.

export const KNOWN_THEMES = ['html', 'css', 'javascript', 'react', 'algo', 'ia'];
export const CARD_TYPES = ['quiz', 'challenge'];

export function withSm2Defaults(card) {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: null,
    lastReview: null,
    ...card,
  };
}

// Validation minimale, retourne { ok, errors[] }.
export function validateCard(card, { allowMissingId = true } = {}) {
  const errors = [];
  if (!card || typeof card !== 'object') return { ok: false, errors: ['Carte invalide'] };
  if (!allowMissingId && card.id == null) errors.push('id manquant');
  if (!card.theme || typeof card.theme !== 'string') errors.push('theme manquant');
  if (!CARD_TYPES.includes(card.type)) errors.push('type doit être quiz ou challenge');
  const diff = Number(card.difficulty);
  if (!Number.isFinite(diff) || diff < 1 || diff > 3)
    errors.push('difficulty doit être 1, 2 ou 3');

  if (card.type === 'quiz') {
    if (!card.question?.trim()) errors.push('question manquante');
    if (!Array.isArray(card.choices) || card.choices.length < 2)
      errors.push('choices doit avoir au moins 2 entrées');
    const ans = Number(card.answer);
    if (!Number.isInteger(ans) || ans < 0 || (Array.isArray(card.choices) && ans >= card.choices.length))
      errors.push('answer doit être un index valide de choices');
  } else if (card.type === 'challenge') {
    if (!card.prompt?.trim()) errors.push('prompt manquant');
    if (!card.starterCode?.trim()) errors.push('starterCode manquant');
    if (!Array.isArray(card.tests) || card.tests.length === 0)
      errors.push('au moins 1 test requis');
    if (Array.isArray(card.tests)) {
      for (const [i, t] of card.tests.entries()) {
        if (!t || typeof t !== 'object') errors.push(`test ${i + 1} invalide`);
        else {
          if (!t.label?.trim()) errors.push(`test ${i + 1} : label manquant`);
          if (!Array.isArray(t.input)) errors.push(`test ${i + 1} : input doit être un tableau`);
          if (!('expected' in t)) errors.push(`test ${i + 1} : expected manquant`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

// Importe un payload JSON (string ou array). Renvoie { cards, errors[] }.
export function parseImport(payload) {
  let raw;
  if (typeof payload === 'string') {
    try {
      raw = JSON.parse(payload);
    } catch (e) {
      return { cards: [], errors: [`JSON invalide : ${e.message}`] };
    }
  } else {
    raw = payload;
  }
  if (!Array.isArray(raw)) return { cards: [], errors: ['Le JSON doit être un tableau de cartes'] };

  const errors = [];
  const cards = [];
  raw.forEach((c, i) => {
    const { ok, errors: errs } = validateCard(c);
    if (!ok) {
      errors.push(`Carte #${i + 1} : ${errs.join(', ')}`);
    } else {
      cards.push(withSm2Defaults({ ...c, difficulty: Number(c.difficulty) }));
    }
  });
  return { cards, errors };
}

// Crée une carte vide pour l'éditeur d'ajout.
export function emptyCard(type = 'quiz', theme = KNOWN_THEMES[0]) {
  if (type === 'quiz') {
    return withSm2Defaults({
      theme,
      type: 'quiz',
      question: '',
      choices: ['', '', '', ''],
      answer: 0,
      explanation: '',
      difficulty: 1,
    });
  }
  return withSm2Defaults({
    theme,
    type: 'challenge',
    prompt: '',
    starterCode: 'function solve() {\n  // ton code\n}',
    tests: [{ label: 'test 1', input: [], expected: '' }],
    hint: '',
    difficulty: 1,
  });
}
