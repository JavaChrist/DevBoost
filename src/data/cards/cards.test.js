import { test } from 'node:test';
import assert from 'node:assert/strict';
import javascriptCards from './javascript.json' with { type: 'json' };
import reactCards from './react.json' with { type: 'json' };
import algoCards from './algo.json' with { type: 'json' };
import htmlCards from './html.json' with { type: 'json' };
import cssCards from './css.json' with { type: 'json' };
import iaCards from './ia.json' with { type: 'json' };

const ALL = [
  ['javascript', javascriptCards],
  ['react', reactCards],
  ['algo', algoCards],
  ['html', htmlCards],
  ['css', cssCards],
  ['ia', iaCards],
];

test('chaque thème a au moins 3 quiz et 2 challenges', () => {
  for (const [theme, cards] of ALL) {
    assert.ok(cards.length >= 5, `${theme}: au moins 5 cartes`);
    const quiz = cards.filter((c) => c.type === 'quiz');
    const ch = cards.filter((c) => c.type === 'challenge');
    assert.ok(quiz.length >= 3, `${theme}: au moins 3 quiz (a: ${quiz.length})`);
    assert.ok(ch.length >= 2, `${theme}: au moins 2 challenges (a: ${ch.length})`);
  }
});

test('quiz : answer pointe sur un index valide de choices, et a une explanation', () => {
  for (const [theme, cards] of ALL) {
    for (const c of cards.filter((c) => c.type === 'quiz')) {
      assert.equal(c.theme, theme);
      assert.ok(Array.isArray(c.choices) && c.choices.length >= 2, 'choices >= 2');
      assert.ok(
        Number.isInteger(c.answer) && c.answer >= 0 && c.answer < c.choices.length,
        `${c.question}: answer index invalide`,
      );
      assert.ok(typeof c.explanation === 'string' && c.explanation.length > 0, 'explanation');
      assert.ok([1, 2, 3].includes(c.difficulty), 'difficulty 1..3');
    }
  }
});

test('challenge : a un starterCode, au moins 3 tests bien formés et un hint', () => {
  for (const [theme, cards] of ALL) {
    for (const c of cards.filter((c) => c.type === 'challenge')) {
      assert.equal(c.theme, theme);
      assert.ok(typeof c.prompt === 'string' && c.prompt.length > 0);
      assert.ok(typeof c.starterCode === 'string' && c.starterCode.includes('function'));
      assert.ok(Array.isArray(c.tests) && c.tests.length >= 3, 'min 3 tests');
      for (const t of c.tests) {
        assert.ok(typeof t.label === 'string' && t.label.length > 0);
        assert.ok(Array.isArray(t.input), 'tests.input doit être un tableau d’arguments');
        assert.ok('expected' in t, 'tests.expected requis');
      }
      assert.ok(typeof c.hint === 'string' && c.hint.length > 0);
    }
  }
});
