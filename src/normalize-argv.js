// @flow
export const looksLikeFlag = (argument: string) => /^-/.test(argument);
export const isShortFlag = (argument: string) => /^-[^-]/.test(argument);

const isNumericFlag = (argument: string) => /^-\d/.test(argument);
const isConjoinedWithValue = (argument: string) => /^--\w+?=/.test(argument);

// Massages the argv until it's ready for consumption.
export default function normalizeArgv(argv: string[]): string[] {
  const normalized = [];

  argv.forEach(arg => {
    if (isConjoinedWithValue(arg)) {
      const [flag, ...argumentParts] = arg.split('=');
      const argument = argumentParts.join('=');

      // It's possible the flags are part of a short group,
      // like "-cvp=8080".
      const normalizedFlags = normalizeArgv([flag]);
      return normalized.push(...normalizedFlags, argument);
    }

    // Numeric (-1337) or just a plain argument.
    if (!looksLikeFlag(arg) || isNumericFlag(arg)) {
      return normalized.push(arg);
    }

    // Explode a group of short flags (e.g. -xzvf) into
    // several independent flags (-x -z -v -f).
    if (isShortFlag(arg) && arg.length > 2) {
      const characters = arg.replace(/^-/, '').split('');
      const independentFlags = characters.map(flag => `-${flag}`);

      return normalized.push(...independentFlags);
    }

    normalized.push(arg);
  });

  return normalized;
}
