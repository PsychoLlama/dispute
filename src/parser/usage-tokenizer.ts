// @flow
import { InputStream, Loc } from './input-stream';

export interface ShortFlag {
  type: 'ShortFlag';
  name: string;
  raw: string;
  loc: Loc;
}

export interface LongFlag {
  type: 'LongFlag';
  name: string;
  raw: string;
  loc: Loc;
}

export interface Argument {
  type: 'Argument';
  required: boolean;
  variadic: boolean;
  name: string;
  raw: string;
  loc: Loc;
}

export interface Punctuation {
  type: 'Punctuation';
  value: string;
  raw: string;
  loc: Loc;
}

export type Token = ShortFlag | LongFlag | Punctuation | Argument;

interface ErrorReport {
  loc: Loc;
  raw: string;
}

export interface Tokenizer {
  reportToken(report: ErrorReport, message: string): SyntaxError;
  isType(type: string): boolean;
  consumeNextToken(): Token;
  eof(): boolean;
  peek(): Token;
}

export default function createTokenizer(inputStream: InputStream): Tokenizer {
  let peekedToken: Token | null = null;

  // Continue reading the source string until the predicate is unsatisfied.
  const readWhile = (
    predicate: (nextChar: string, acc: string) => boolean
  ): string => {
    let acc = '';

    while (!inputStream.eof() && predicate(inputStream.peek(), acc)) {
      acc += inputStream.consumeNextChar();
    }

    return acc;
  };

  const discardWhitespace = (): string =>
    readWhile((char: string) => /\s/.test(char));

  // Reads a longer CLI flag like (e.g. --color).
  const readLongFlag = (loc: Loc): LongFlag => {
    inputStream.consumeNextChar();
    const flagName = readWhile((char: string) => /[\w-]/.test(char));
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
    const flagName = readWhile((char: string) => /\w/.test(char));
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

  // Safely peek at the next character.
  const isChar = (char: string): boolean => {
    if (inputStream.eof()) {
      throw inputStream.generateError({
        message: `Usage string ended unexpectedly (looking for "${char}").`,
        loc: inputStream.getLoc(),
      });
    }

    return inputStream.peek() === char;
  };

  const isFlag = (): boolean => isChar('-');
  const readFlag = (): ShortFlag | LongFlag => {
    const loc = inputStream.getLoc();
    inputStream.consumeNextChar();

    // Two hyphens back to back can only mean one thing.
    if (isChar('-')) return readLongFlag(loc);
    return readShortFlag(loc);
  };

  // Assert the next character matches the given string.
  const expect = (expected: string): string => {
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

  const isPunctuation = (): boolean => isChar('=') || isChar(',');
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

  const readVariadicPunctuation = (): string => {
    return expect('.') + expect('.') + expect('.');
  };

  // Examples:
  // - <required-arg>
  // - <variadic...>
  // - [optional]
  // - [value...]
  const isArgument = (): boolean => isChar('<') || isChar('[');
  const readArgument = (): Argument => {
    const loc = inputStream.getLoc();
    let raw = '';

    const required = isChar('<');
    raw += expect(required ? '<' : '[');

    const argName = readWhile((char: string) => /[\w-]/.test(char));
    raw += argName;

    const variadic = isChar('.');
    if (variadic) raw += readVariadicPunctuation();

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
    eof: (): boolean => {
      if (peekedToken) return false;

      discardWhitespace();
      return inputStream.eof();
    },

    consumeNextToken(): Token {
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

      throw inputStream.generateError({
        message: `Unexpected character "${inputStream.peek()}"`,
        loc: inputStream.getLoc(),
      });
    },

    reportToken(token: Token, message: string): SyntaxError {
      return inputStream.generateError({
        ...token,
        length: token.raw.length,
        message,
      });
    },

    // Look at the next token without removing it from the queue.
    peek(): Token {
      peekedToken = peekedToken || this.consumeNextToken();
      return peekedToken;
    },

    isType: (type: string): boolean => {
      const token = controls.peek();
      return token.type === type;
    },
  };

  return controls;
}
