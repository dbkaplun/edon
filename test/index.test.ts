import { edonNoninteractive, edonInteractive } from '../src/edon';

describe('edonNoninteractive', () => {
  it('should work', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    const p = edonNoninteractive();
    const logMe = `after rAF: ${Math.random()}`;
    process.stdin.emit('data', Buffer.from(
      `
        // \`requestAnimationFrame\` is browser-specific
        const raf = requestAnimationFrame(() => {
          console.log(${JSON.stringify(logMe)});
        });
        console.log(raf);
      `,
      'utf8',
    ));
    process.stdin.emit('end');

    await p;
    expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    expect(consoleLogSpy).toHaveBeenNthCalledWith(1, expect.any(Number));
    expect(consoleLogSpy).toHaveBeenNthCalledWith(2, logMe);
  });
});
