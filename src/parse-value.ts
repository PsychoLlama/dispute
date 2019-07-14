// @flow
const TRUTHY_VALUES = new Set(['true', 'yes', 'on']);
const FALSEY_VALUES = new Set(['false', 'no', 'off']);

export type OptionArgument = {
  createParseError: (errorMessage: string) => Error,
  input: string,
  flag: string,
};

// --color, --color=yes, --color=on
export const asBoolean = (arg: OptionArgument): boolean => {
  if (!arg.input) return true;
  if (TRUTHY_VALUES.has(arg.input)) return true;
  if (FALSEY_VALUES.has(arg.input)) return false;

  throw arg.createParseError(
    `The ${arg.flag} option got a surprising value "${arg.input}".\n` +
      `It expects a boolean value, like "true", "false", "on", or "off".`
  );
};

// --org, --org=string
export const asString = (arg: OptionArgument): string | void =>
  arg.input || undefined;

// --count=10, --count=0xf8ddca
export const asNumber = (arg: OptionArgument): number | void => {
  if (!arg.input) return undefined;
  const number = Number(arg.input);

  if (!isFinite(number)) {
    throw arg.createParseError(
      `Couldn't parse "${arg.input}" into a number (got ${number}).`
    );
  }

  return number;
};
