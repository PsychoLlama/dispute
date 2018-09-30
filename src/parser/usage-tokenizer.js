// @flow
import type { InputStream, Loc } from './input-stream';

type ShortFlag = {
  type: 'ShortFlag',
  name: string,
  raw: string,
  loc: Loc,
};

type LongFlag = {
  type: 'LongFlag',
  name: string,
  raw: string,
  loc: Loc,
};

type Argument = {
  type: 'Argument',
  variadic: boolean,
  required: boolean,
  raw: string,
  loc: Loc,
};

type Token = ShortFlag | LongFlag | Argument;

type ErrorReport = Token & { message: string };

export interface Tokenizer {
  reportToken(ErrorReport): void;
  consumeNextToken(): Token;
  eof(): boolean;
  peek(): Token;
}

export default function createTokenizer(inputStream: InputStream) {
  let peekedToken = null;

  // Continue reading the source string until the predicate is unsatisfied.
  const readWhile = (predicate: (nextChar: string, acc: string) => boolean) => {
    let acc = '';

    while (!inputStream.eof() && predicate(inputStream.peek(), acc)) {
      acc += inputStream.consumeNextChar();
    }

    return acc;
  };

  const discardWhitespace = () => readWhile(char => /\s/.test(char));

  const readLongFlag = (loc: Loc): LongFlag => {
    inputStream.consumeNextChar();
    const flagName = readWhile(char => /\w/.test(char));
    const raw = `--${flagName}`;

    return {
      type: 'LongFlag',
      name: flagName,
      loc,
      raw,
    };
  };

  // Shorthand flags, like "$ cmd -q -s".
  const readShortFlag = (loc: Loc): ShortFlag => {
    const flagName = readWhile(char => /\w/.test(char));
    const raw = `-${flagName}`;

    if (!/\w/.test(flagName)) {
      throw inputStream.generateError({
        message: `Expected a flag name, found "${flagName}".`,
        length: flagName.length,
        loc,
      });
    }

    // The user passed something terrible like "-name" or "-port".
    if (!/^\d+$/.test(flagName) && flagName.length > 1) {
      throw inputStream.generateError({
        message: `Only one short flag is allowed per usage definition.`,
        length: flagName.length,
        loc,
      });
    }

    return {
      type: 'ShortFlag',
      name: flagName,
      loc,
      raw,
    };
  };

  const isFlag = () => isChar('-');
  const readFlag = (): ShortFlag | LongFlag => {
    const loc = inputStream.getLoc();
    inputStream.consumeNextChar();

    // Two hyphens back to back can only mean one thing.
    if (isChar('-')) return readLongFlag(loc);
    return readShortFlag(loc);
  };

  // Safely peek at the next character.
  const isChar = char => {
    if (inputStream.eof()) {
      throw inputStream.generateError({
        message: `Usage string ended unexpectedly (looking for "${char}").`,
        loc: inputStream.getLoc(),
      });
    }

    return inputStream.peek() === char;
  };

  const expect = expected => {
    const actual = inputStream.consumeNextChar();

    if (actual !== expected) {
      throw inputStream.generateError({
        message: `Expected a "${expected}" character, got "${actual}".`,
        loc: inputStream.getLoc(),
      });
    }

    return actual;
  };

  const discardVariadicArgs = () => expect('.') + expect('.') + expect('.');

  // Option argument, e.g.:
  // - <required-arg>
  // - [optional]
  // - <required-variadic...>
  const isArgument = () => isChar('<') || isChar('[');
  const readArgument = (): Argument => {
    const loc = inputStream.getLoc();
    let raw = '';

    const required = isChar('<');
    raw += inputStream.consumeNextChar();

    const argName = readWhile(char => /[\w-]/.test(char));
    raw += argName;

    const variadic = isChar('.');
    if (variadic) raw += discardVariadicArgs();
    raw += expect(required ? '>' : ']');

    return {
      type: 'Argument',
      name: argName,
      required,
      variadic,
      raw,
      loc,
    };
  };

  const controls: Tokenizer = {
    eof: () => {
      discardWhitespace();
      return inputStream.eof();
    },

    consumeNextToken() {
      if (peekedToken) {
        const result = peekedToken;
        peekedToken = null;

        return result;
      }

      if (inputStream.eof()) {
        throw new RangeError('End of input reached');
      }

      discardWhitespace();

      if (isFlag()) return readFlag();
      if (isArgument()) return readArgument();

      // Workaround for Flow. It doesn't know about assertions.
      throw inputStream.generateError({
        message: `Unexpected character "${inputStream.peek()}"`,
        loc: inputStream.getLoc(),
      });
    },

    reportToken(token) {
      throw inputStream.generateError({
        ...token,
        length: token.raw.length,
      });
    },

    // Look at the next token without removing it from the queue.
    peek() {
      peekedToken = peekedToken || this.consumeNextToken();
      return peekedToken;
    },
  };

  return controls;
}
