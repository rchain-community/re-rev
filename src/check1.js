import process from 'node:process';
import { Mnemonic, ethers } from 'ethers';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';

// import { pubkeyToAddress } from '@cosmjs/amino';

import crypto from 'node:crypto';
import { bech32 } from 'bech32';

// bech32 spec https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki 2017-03-20

const pkToBech32 = (data, prefix) => {
  const sha256Digest = crypto
    .createHash('sha256')
    .update(data, 'hex')
    .digest('hex');

  const ripemd160Digest = crypto
    .createHash('ripemd160')
    .update(sha256Digest, 'hex')
    .digest('hex');

  const bech32Words = bech32.toWords(Buffer.from(ripemd160Digest, 'hex'));
  const words = new Uint8Array([0, ...bech32Words]);
  const address = bech32.encode(prefix, words);
  return address;
};

const agoricChain = {
  bech32PrefixAccAddr: 'agoric',
  coinType: 564,
};

const getAgoricHdPath = (coinType = agoricChain.coinType, account = 0) =>
  stringToPath(`m/44'/${coinType}'/${account}'/0/0`);

const main = async (io = {}) => {
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

main();
