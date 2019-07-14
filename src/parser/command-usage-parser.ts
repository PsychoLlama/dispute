// @flow
import createTokenizer, { Argument as ArgToken } from './usage-tokenizer';
import createStream from './input-stream';

export interface Argument {
  required: boolean;
  variadic: boolean;
  type: 'Argument';
  name: string;
  raw: string;
}

export default function parseCommandUsage(usage: string): Argument[] {
  const tokenizer = createTokenizer(createStream(usage));
  const { isType } = tokenizer;
  const args: Argument[] = [];

  const assertValidArgumentOrdering = (arg: ArgToken) => {
    const precededByOptional = args.find(arg => !arg.required);
    if (!arg.required || !precededByOptional) return;
    throw tokenizer.reportToken(arg, `Required arguments should come first.`);
  };

  const readArgument = (): Argument => {
    const arg = tokenizer.consumeNextToken() as ArgToken;
    const { name, variadic, required, type, raw } = arg;
    assertValidArgumentOrdering(arg);

    return {
      required,
      variadic,
      name,
      type,
      raw,
    };
  };

  const reportFlag = () => {
    const token = tokenizer.consumeNextToken();
    throw tokenizer.reportToken(
      token,
      `Flags aren't allowed here.\n` +
        `Add them to the "options: {...}" object.`
    );
  };

  const reportUnrecognizedToken = () => {
    const token = tokenizer.consumeNextToken();
    throw tokenizer.reportToken(
      token,
      `Unexpected token "${token.type}".\n` +
        `Only arguments are allowed (e.g. "[dir]", "<values...>", etc)`
    );
  };

  const readNextToken = () => {
    if (isType('Argument')) return readArgument();
    if (isType('ShortFlag') || isType('LongFlag')) return reportFlag();
    return reportUnrecognizedToken();
  };

  while (!tokenizer.eof()) {
    const arg = readNextToken();
    args.push(arg);
  }

  return args;
}
