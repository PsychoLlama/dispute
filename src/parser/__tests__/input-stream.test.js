// @flow
import createStream from '../input-stream';

describe('Input stream', () => {
  it('returns an interface', () => {
    expect(createStream).toEqual(expect.any(Function));

    const stream = createStream('yolo');
    expect(stream.peek).toEqual(expect.any(Function));
    expect(stream.consumeNextChar).toEqual(expect.any(Function));
    expect(stream.reportError).toEqual(expect.any(Function));
  });

  it('consumes the text one character at a time', () => {
    const stream = createStream('text');

    expect(stream.consumeNextChar()).toBe('t');
    expect(stream.consumeNextChar()).toBe('e');
    expect(stream.consumeNextChar()).toBe('x');
    expect(stream.consumeNextChar()).toBe('t');
    expect(stream.consumeNextChar()).toBe(null);
  });

  it('has no effect while peeking at the next character', () => {
    const stream = createStream('text');

    expect(stream.peek()).toBe('t');
    expect(stream.peek()).toBe('t');

    stream.consumeNextChar();
    expect(stream.peek()).toBe('e');
    expect(stream.peek()).toBe('e');

    stream.consumeNextChar();
    expect(stream.peek()).toBe('x');
    expect(stream.peek()).toBe('x');

    stream.consumeNextChar();
    stream.consumeNextChar();
    expect(stream.peek()).toBe(null);
    expect(stream.peek()).toBe(null);
  });

  it('returns the correct line and column', () => {
    const stream = createStream('ab\ncd');

    expect(stream.getLoc()).toEqual({ line: 0, column: 0 });
    stream.consumeNextChar();
    expect(stream.getLoc()).toEqual({ line: 0, column: 1 });
    stream.consumeNextChar();
    expect(stream.getLoc()).toEqual({ line: 0, column: 2 });
    stream.consumeNextChar();
    expect(stream.getLoc()).toEqual({ line: 1, column: 0 });
    stream.consumeNextChar();
    expect(stream.getLoc()).toEqual({ line: 1, column: 1 });
  });

  it('throws an error on report', () => {
    const stream = createStream('something');
    const message = 'Testing `.reportError(...)`';
    const fail = () =>
      stream.reportError({
        column: 0,
        line: 0,
        message,
      });

    expect(fail).toThrow(SyntaxError);
    expect(fail).toThrow(
      expect.objectContaining({
        message: expect.stringContaining(message),
      })
    );
  });
});
