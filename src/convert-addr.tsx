// @ts-check
import blake from 'blakejs';
import { ethers } from 'ethers';
import { stringToPath } from '@cosmjs/crypto';
import { pubkeyToAddress } from '@cosmjs/amino';
import { toBase64 } from '@cosmjs/encoding';
import { Base16 } from './codec.js';

// import { pubkeyToAddress } from '@cosmjs/amino';

const agoricChain = {
  bech32PrefixAccAddr: 'agoric',
  coinType: 564,
};

export const personalDigest = (msg: string) => {
  const { MessagePrefix, id } = ethers;
  const prefixed = `${MessagePrefix}${msg.length}${msg}`;
  const digest = id(prefixed);
  return { prefixed, digest };
};

export const recoverPublicKey = (msg: string, sig: string) => {
  const { SigningKey } = ethers;
  const { digest } = personalDigest(msg);
  const recovered = SigningKey.recoverPublicKey(digest, sig);
  const publicKey = SigningKey.computePublicKey(recovered, true);
  return publicKey;
};

// https://github.com/Agoric/agoric-sdk/discussions/5830
export const getHdPath = (coinType = agoricChain.coinType, account = 0) =>
  stringToPath(`m/44'/${coinType}'/${account}'/0/0`);

// Prefix as defined in https://github.com/rchain/rchain/blob/c6721a6/rholang/src/main/scala/coop/rchain/rholang/interpreter/util/RevAddress.scala#L13
const REV = { coinId: '000000', version: '00' };

/**
 * Get REV address from ETH address.
 *
 * ref https://github.com/rchain-community/rchain-api/blob/master/src/rev-address.js
 */
export const getAddrFromEth = (ethAddrRaw: string): string | null => {
  const { keccak256, encodeBase58 } = ethers;
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

/**
 * See also: agd debug pubkey-raw
 *
 * @param publicKey compressed secp256k1 public key in hex
 */
export const pubKeyToCosmosAddr = (publicKey: string, prefix: string) => {
  const pubkey = {
    type: 'tendermint/PubKeySecp256k1',
    value: toBase64(Base16.decode(publicKey.replace(/^0x/, ''))),
  };
  const cosmosAddr = pubkeyToAddress(pubkey, prefix);
  return cosmosAddr;
};
