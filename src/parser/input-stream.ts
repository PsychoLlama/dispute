import indent from 'indent-string';
import chalk from 'chalk';

export interface Loc {
  column: number;
  line: number;
}

interface ErrorReport {
  message: string;
  length?: number;
  loc: Loc;
}

export interface InputStream {
  generateError(report: ErrorReport): SyntaxError;
  consumeNextChar(): string;
  peek(): string;
  eof(): boolean;
  getLoc(): Loc;
}

interface FrameDetails {
  sourceText: string;
  length: number;
  loc: Loc;
}

export const createErrorFrame = (frame: FrameDetails) => {
  const offset = Array(frame.loc.column).fill(' ').join('');

  // Generate a syntax highlight.
  // Something like '  ^^^^^^^^^'
  const underline = Array(frame.length).fill('^').join('');

  const highlight = offset + chalk.red(underline);

  return frame.sourceText + '\n' + highlight;
};

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
      const frame = createErrorFrame({
        length: report.length || 1,
        loc: report.loc,
        sourceText,
      });

      return new SyntaxError(`${report.message}\n\n${indent(frame, 2)}\n`);
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
