// @flow
type PaddingOptions = {
  extraWhitespace: number;
};

export const sortAlphabetically = (a: string, b: string) => (a > b ? 1 : -1);

// Create a string of nothing but whitespace.
export const whitespace = (charCount: number) =>
  Array(charCount)
    .fill(' ')
    .join('');

// Find the longest string, returning a function that adds whitespace
// to the given string so it matches the size of the longest.
// Used for alignment in help output.
export const padStringMatchingLongest = (
  allPossibleStrings: string[],
  options: PaddingOptions = { extraWhitespace: 0 }
) => {
  const maxStringLength = allPossibleStrings.reduce(
    (longestSize, str) => Math.max(longestSize, str.length),
    0
  );

  const offsetWhitespace = whitespace(
    maxStringLength + options.extraWhitespace
  );

  return (contents: string) => {
    const padding = offsetWhitespace.slice(contents.length);
    return contents + padding;
  };
};
