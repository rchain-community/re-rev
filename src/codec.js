// @ts-check
const { freeze } = Object;

const te = freeze(new TextEncoder());

export const Base16 = freeze({
  /**
   * Encode bytes to base 16 string.
   *
   * @param {Uint8Array | number[]} bytes
   * @returns { string }
   */
  encode(bytes) {
    return (
      Array.from(bytes)
        // eslint-disable-next-line no-bitwise
        .map(x => (x & 0xff).toString(16).padStart(2, '0'))
        .join('')
    );
  },

  encodeText(txt) {
    const bytes = te.encode(txt);
    return Base16.encode(bytes);
  },

  /**
   * Decode base 16 string to bytes.
   *
   * @param {string} hexStr
   */
  decode: hexStr => {
    const removed0x = hexStr.replace(/^0x/, '');
    const [resArr] = Array.from(removed0x).reduce(
      ([arr, bhi], x) =>
        bhi ? [[...arr, parseInt(`${bhi}${x}`, 16)]] : [arr, x],
      [[]],
    );
    return Uint8Array.from(resArr);
  },

  /**
   * Encode bytes as hex string
   *
   * ISSUE: uses Buffer API. Require this for browsers?
   * @param {Uint8Array | Buffer} bytes
   * @returns { string }
   */
  encodeBuf(bytes) {
    return Buffer.from(bytes).toString('hex');
  },

  /**
   * Decode hex string to bytes
   * @param {string} hex in hex (base16)
   * @returns { Buffer }
   */
  decodeBuf(hex) {
    return Buffer.from(hex, 'hex');
  },
});
