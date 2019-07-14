// @flow
import {
  whitespace,
  sortAlphabetically,
  padStringMatchingLongest,
} from '../utils';

describe('Help utilities', () => {
  describe('sortAlphabetically(...)', () => {
    it('puts items into alphabetical order', () => {
      const items = ['alpha', 'charlie', 'bravo'];
      const sorted = items.slice().sort(sortAlphabetically);

      expect(sorted).toEqual(['alpha', 'bravo', 'charlie']);
    });
  });

  describe('whitespace(...)', () => {
    it('returns a string', () => {
      const result = whitespace(0);

      expect(result).toBe('');
    });

    it('returns the correct number of spaces', () => {
      const length = 5;
      const result = whitespace(length);

      expect(result).toHaveLength(length);
    });
  });

  describe('padStringMatchingLongest(...)', () => {
    it('returns the same string when no samples are given', () => {
      const pad = padStringMatchingLongest([]);

      expect(pad).toEqual(expect.any(Function));
      expect(pad('str')).toBe('str');
    });

    it('ensures shorter strings are the same size as the longest', () => {
      const str1 = 'str';
      const str2 = 'string';
      const pad = padStringMatchingLongest([str1, str2]);

      expect(pad(str1)).toHaveLength(str2.length);
    });

    it('returns the same string given the longest', () => {
      const str1 = 'str';
      const str2 = 'string';
      const pad = padStringMatchingLongest([str1, str2]);

      expect(pad(str2)).toBe(str2);
    });

    it('uses the given padding value', () => {
      const str1 = 'potatoes';
      const str2 = 'nomenclature';
      const pad = padStringMatchingLongest([str1, str2], {
        extraWhitespace: 5,
      });

      expect(pad(str2)).toHaveLength(str2.length + 5);
    });
  });
});
