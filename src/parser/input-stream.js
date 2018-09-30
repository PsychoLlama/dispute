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
  reportError(ErrorReport): ?string;
  consumeNextChar(): ?string;
  peek(): ?string;
  getLoc(): Loc;
}

export default function createStream(sourceText: string) {
  let cursor = 0;
  let column = 0;
  let line = 0;

  const controls: InputStream = {
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
    reportError(report) {
      throw new SyntaxError(report.message);
    },
    peek() {
      const character = sourceText[cursor];
      return character || null;
    },
  };

  return controls;
}
