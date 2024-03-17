// @ts-check

import anyTest from 'ava';
import { Mnemonic, ethers } from 'ethers';
import { pubkeyToAddress } from '@cosmjs/amino';
import { toBase64 } from '@cosmjs/encoding';
import {
  getAddrFromEth,
  personalDigest,
  pubKeyToCosmosAddr,
  recoverPublicKey,
} from '../src/convert-addr.js';

const acct1 = {
  phrase: `purchase practice song follow wall soda
    matter cloud pudding combine material
    repeat pelican typical renew hold banana
    pigeon machine enact paddle parade hour album`,
  revAddr: '11111he8e2YukkSLDUtzuZJhfVpENpZAX9RfBZj9Qrw377u6baFB7p',
};

/** @type {import('ava').TestFn<Awaited<ReturnType<typeof makeTestContext>>>} */
// @ts-expect-error cast
const test = anyTest;

const makeTestContext = async () => {
  const mnemonic = Mnemonic.fromPhrase(acct1.phrase);
  const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic);
  return { ethWallet: wallet };
};
test.before(async t => (t.context = await makeTestContext()));

test('reREV signIn yields public key', async t => {
  const { hexlify, toUtf8Bytes } = ethers;
  const { ethWallet } = t.context;
  const msg = 'I agree to reREV terms and conditions.';
  const { digest, prefixed } = personalDigest(msg);
  t.log('known', {
    address: ethWallet.address,
    message: msg,
    messageHex: hexlify(toUtf8Bytes(prefixed)),
    digest,
  });

  const sig = await ethWallet.signMessage(msg);

  const publicKey = recoverPublicKey(msg, sig);

  t.log('recovered', {
    sig,
    publicKey,
  });
  t.is(publicKey, ethWallet.publicKey);
});

test('derive REV address from ETH address', async t => {
  const { ethWallet } = t.context;
  const ethAddr = ethWallet.address;
  const revAddr = getAddrFromEth(ethAddr);
  t.log({ ethAddr, revAddr });
  t.is(revAddr, acct1.revAddr);
});

test('derive cosmos address from public key', t => {
  const { ethWallet } = t.context;

  const cases = [
    {
      publicKey:
        '0x02e44c50d8b496301b51d60261f1e566b8e73b8b8ac732ccda74644260bc2af308',
      prefix: 'agoric',
      cosmosAddr: 'agoric17rf3urdhup42n5avnptddtm9l25g7ytngwruyr',
    },
    {
      publicKey: ethWallet.publicKey,
      prefix: 'agoric',
      cosmosAddr: 'agoric199dfhzdjldedy69xy2qxnnynughtvjppurme4v',
    },
    {
      publicKey: ethWallet.publicKey,
      prefix: 'juno',
      cosmosAddr: 'juno199dfhzdjldedy69xy2qxnnynughtvjppcv6azx',
    },
  ];

  for (const { publicKey, prefix, cosmosAddr: expected } of cases) {
    const actual = pubKeyToCosmosAddr(publicKey, prefix);

    t.log({ publicKey, cosmos: actual });
    t.is(actual, expected);
  }
});
