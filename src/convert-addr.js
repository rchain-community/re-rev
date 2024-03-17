// @ts-check
import process from 'node:process';
import crypto from 'node:crypto';
import { bech32 } from 'bech32';
import blake from 'blakejs';
import { Mnemonic, ethers } from 'ethers';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';

// import { pubkeyToAddress } from '@cosmjs/amino';

const { freeze } = Object;

const agoricChain = {
  bech32PrefixAccAddr: 'agoric',
  coinType: 564,
};

/** @param {string} msg */
export const personalDigest = msg => {
  const { MessagePrefix, id } = ethers;
  const prefixed = `${MessagePrefix}${msg.length}${msg}`;
  const digest = id(prefixed);
  return { prefixed, digest };
};

export const recoverPublicKey = (msg, sig) => {
  const { SigningKey } = ethers;
  const { digest } = personalDigest(msg);
  const recovered = SigningKey.recoverPublicKey(digest, sig);
  const publicKey = SigningKey.computePublicKey(recovered, true);
  return publicKey;
};

// bech32 spec https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki 2017-03-20

export const pkToBech32 = (data, prefix) => {
  const sha256Digest = crypto
    .createHash('sha256')
    .update(data, 'hex')
    .digest('hex');

  const ripemd160Digest = crypto
    .createHash('ripemd160')
    .update(sha256Digest, 'hex')
    .digest('hex');

  const bech32Words = bech32.toWords(Base16.decode(ripemd160Digest));
  const words = new Uint8Array([0, ...bech32Words]);
  const address = bech32.encode(prefix, words);
  return address;
};

// https://github.com/Agoric/agoric-sdk/discussions/5830
const getAgoricHdPath = (coinType = agoricChain.coinType, account = 0) =>
  stringToPath(`m/44'/${coinType}'/${account}'/0/0`);

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

  /**
   * Decode base 16 string to bytes.
   *
   * @param {string} hexStr
   */
  decode: hexStr => {
    const removed0x = hexStr.replace(/^0x/, '');
    const byte2hex = ([arr, bhi], x) =>
      bhi ? [[...arr, parseInt(`${bhi}${x}`, 16)]] : [arr, x];
    const [resArr] = Array.from(removed0x).reduce(byte2hex, [[]]);
    return Uint8Array.from(resArr);
  },
});

// Prefix as defined in https://github.com/rchain/rchain/blob/c6721a6/rholang/src/main/scala/coop/rchain/rholang/interpreter/util/RevAddress.scala#L13
const REV = { coinId: '000000', version: '00' };

/**
 * Get REV address from ETH address.
 *
 * @param {string} ethAddrRaw
 * @returns {string | null}
 *
 * ref https://github.com/rchain-community/rchain-api/blob/master/src/rev-address.js
 */
export const getAddrFromEth = ethAddrRaw => {
  const { keccak256, encodeBase58, toUtf8Bytes } = ethers;
  const ethAddr = ethAddrRaw.replace(/^0x/, '');
  if (!ethAddr || ethAddr.length !== 40) return null;

  // Hash ETH address
  const ethAddrBytes = Base16.decode(ethAddr);
  const ethHash = keccak256(ethAddrBytes);

  // Add prefix with hash and calculate checksum (blake2b-256 hash)
  const payload = `${REV.coinId}${REV.version}${ethHash}`;
  const payloadBytes = Base16.decode(payload);
  const checksum = blake.blake2bHex(payloadBytes, undefined, 32).slice(0, 8);

  // Return REV address
  return encodeBase58(Base16.decode(`${payload}${checksum}`));
};

export const main = async (io = {}) => {
  const { env = process.env } = io;
  const mnemonic = Mnemonic.fromPhrase(env.REREV_MNEMONIC);
  const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic);
  console.log(wallet);

  const agWallet = await DirectSecp256k1HdWallet.fromMnemonic(
    env.REREV_MNEMONIC,
    {
      prefix: agoricChain.bech32PrefixAccAddr,
      hdPaths: [getAgoricHdPath(60)],
    },
  );
  const accounts = await agWallet.getAccounts();
  console.log({ accounts });
  console.log(accounts.map(a => Buffer.from(a.pubkey)));

  //   const pubkey = {
  //     type: 'tendermint/PubKeySecp256k1',
  //     value: Buffer.from(wallet.publicKey.replace(/^0x/, ''), 'hex'),
  //   };
  //   const jaddr = pubkeyToAddress(pubkey, 'agoric');
  const pubKey = Buffer.from(wallet.publicKey.replace(/^0x/, ''), 'hex');
  console.log({ pubKey });
  const jaddr = pkToBech32(pubKey, 'agoric');
  console.log(jaddr);
};
