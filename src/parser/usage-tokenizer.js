// @flow
import type { InputStream, Loc } from './input-stream';

export type ShortFlag = {
  type: 'ShortFlag',
  name: string,
  raw: string,
  loc: Loc,
};

export type LongFlag = {
  type: 'LongFlag',
  name: string,
  raw: string,
  loc: Loc,
};

export type Argument = {
  type: 'Argument',
  required: boolean,
  variadic: boolean,
  name: string,
  raw: string,
  loc: Loc,
};

export type Punctuation = {
  type: 'Punctuation',
  value: string,
  raw: string,
  loc: Loc,
};

export type Token = ShortFlag | LongFlag | Punctuation | Argument;

type ErrorReport = { loc: Loc, raw: string };

export interface Tokenizer {
  reportToken(ErrorReport, message: string): SyntaxError;
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

  // Reads a longer CLI flag like (e.g. --color).
  const readLongFlag = (loc: Loc): LongFlag => {
    inputStream.consumeNextChar();
    const flagName = readWhile(char => /[\w-]/.test(char));
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

  // Assert the next character matches the given string.
  const expect = expected => {
    if (inputStream.eof()) {
      throw inputStream.generateError({
        message: `Usage string ended abruptly (expected "${expected}").`,
        loc: inputStream.getLoc(),
      });
    }

    const actual = inputStream.consumeNextChar();

    if (actual !== expected) {
      throw inputStream.generateError({
        message: `Expected a "${expected}" character, got "${actual}".`,
        loc: inputStream.getLoc(),
      });
    }

    return actual;
  };

  const isPunctuation = () => isChar('=') || isChar(',');
  const readPunctuation = (): Punctuation => {
    const loc = inputStream.getLoc();
    const value = inputStream.consumeNextChar();
    return {
      type: 'Punctuation',
      raw: value,
      value,
      loc,
    };
  };

  const readVariadicPunctuation = () => {
    expect('.');
    expect('.');
    expect('.');
  };

  // Examples:
  // - <required-arg>
  // - <variadic...>
  // - [optional]
  // - [value...]
  const isArgument = () => isChar('<') || isChar('[');
  const readArgument = (): Argument => {
    const loc = inputStream.getLoc();
    let raw = '';

    const required = isChar('<');
    raw += expect(required ? '<' : '[');

    const argName = readWhile(char => /[\w-]/.test(char));
    const variadic = isChar('.');
    if (variadic) readVariadicPunctuation();
    raw += argName + expect(required ? '>' : ']');

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
      if (peekedToken) return false;

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

      if (isPunctuation()) return readPunctuation();
      if (isFlag()) return readFlag();
      if (isArgument()) return readArgument();

      // Workaround for Flow. It doesn't know about assertions.
      throw inputStream.generateError({
        message: `Unexpected character "${inputStream.peek()}"`,
        loc: inputStream.getLoc(),
      });
    },

    reportToken(token, message) {
      return inputStream.generateError({
        ...token,
        length: token.raw.length,
        message,
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
