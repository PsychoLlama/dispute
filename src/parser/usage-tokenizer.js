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
  consumeNextToken(): ?Token;
  peek(): ?Token;
}

export default function createTokenizer(inputStream: InputStream) {
  let peekedToken = null;

  // Continue reading the source string until the predicate is unsatisfied.
  const readWhile = (predicate: (nextChar: string, acc: string) => boolean) => {
    let nextChar;
    let acc = '';

    while ((nextChar = inputStream.peek()) && predicate(nextChar, acc)) {
      inputStream.consumeNextChar();
      acc += nextChar;
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

  const readShortFlag = (loc: Loc): ShortFlag => {
    const flagName = readWhile(char => /\w/.test(char));
    const raw = `-${flagName}`;

    if (!/\w/.test(flagName)) {
      inputStream.reportError({
        message: `Expected a flag name, found "${flagName}".`,
        loc,
      });
    }

    // The user passed something terrible like "-name" or "-port".
    if (!/^\d+$/.test(flagName) && flagName.length > 1) {
      inputStream.reportError({
        message: `Only one short flag is allowed per usage definition.`,
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

  const isFlag = char => char === '-';
  const readFlag = (): ShortFlag | LongFlag => {
    const loc = inputStream.getLoc();
    inputStream.consumeNextChar();

    // Two hyphens back to back can only mean one thing.
    if (inputStream.peek() === '-') return readLongFlag(loc);
    return readShortFlag(loc);
  };

  const controls: Tokenizer = {
    consumeNextToken() {
      if (peekedToken) {
        const result = peekedToken;
        peekedToken = null;

        return result;
      }

      discardWhitespace();
      const nextChar = inputStream.peek();

      if (isFlag(nextChar)) return readFlag();
    },

    reportToken(token) {
      inputStream.reportError({
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
