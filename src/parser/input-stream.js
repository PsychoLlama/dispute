// @flow
export type Loc = {
  column: number,
  line: number,
};

type ErrorReport = {
  message: string,
  length?: number,
  loc: Loc,
};

export interface InputStream {
  generateError(ErrorReport): SyntaxError;
  consumeNextChar(): string;
  peek(): string;
  eof(): boolean;
  getLoc(): Loc;
}

export default function createStream(sourceText: string) {
  let cursor = 0;
  let column = 0;
  let line = 0;

  const controls: InputStream = {
    eof: () => cursor === sourceText.length,
    getLoc: () => ({ line, column }),
    consumeNextChar() {
      const character = this.peek();
      cursor += 1;

      if (character === '\n') {
        column = 0;
        line += 1;
      } else {
        column += 1;
      }

      return character;
    },

    generateError(report) {
      return new SyntaxError(report.message);
    },

    peek() {
      if (this.eof()) {
        throw new RangeError(
          'Attempted to read past the end of the source text'
        );
      }

      return sourceText[cursor];
    },
  };

  return controls;
}
