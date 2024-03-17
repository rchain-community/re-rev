// @ts-check
const { freeze } = Object;

const te = freeze(new TextEncoder());

export const Base16 = freeze({
  /**
   * Encode bytes to base 16 string.
   */
  encode(bytes: Uint8Array | number[]): string {
    return (
      Array.from(bytes)
        // eslint-disable-next-line no-bitwise
        .map(x => (x & 0xff).toString(16).padStart(2, '0'))
        .join('')
    );
  },

  encodeText(txt: string) {
    const bytes = te.encode(txt);
    return Base16.encode(bytes);
  },

  /**
   * Decode base 16 string to bytes.
   */
  decode: (hexStr: string) => {
    const removed0x = hexStr.replace(/^0x/, '');
    const [resArr] = Array.from(removed0x).reduce(
      ([arr, bhi], x: string) =>
        bhi ? [[...arr, parseInt(`${bhi}${x}`, 16)], null] : [arr, x],
      [[], null] as [number[], string | null],
    );
    return Uint8Array.from(resArr);
  },

  /**
   * Encode bytes as hex string
   *
   * ISSUE: uses Buffer API. Require this for browsers?
   */
  encodeBuf(bytes: Uint8Array | Buffer): string {
    return Buffer.from(bytes).toString('hex');
  },

  /**
   * Decode hex string to bytes
   */
  decodeBuf(hex: string): Buffer {
    return Buffer.from(hex, 'hex');
  },
});
