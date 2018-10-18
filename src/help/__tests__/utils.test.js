// @flow
import { sortAlphabetically } from '../utils';

describe('Help utilities', () => {
  describe('sortAlphabetically', () => {
    it('puts items into alphabetical order', () => {
      const items = ['alpha', 'charlie', 'bravo'];
      const sorted = items.slice().sort(sortAlphabetically);

      expect(sorted).toEqual(['alpha', 'bravo', 'charlie']);
    });
  });
});
