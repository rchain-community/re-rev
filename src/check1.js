import process from 'node:process';
import { Mnemonic, ethers } from 'ethers';

const main = async (io = {}) => {
  const { env = process.env } = io;
  const mnemonic = Mnemonic.fromPhrase(env.REREV_MNEMONIC);
  const wallet = ethers.HDNodeWallet.fromMnemonic(mnemonic);
  console.log(wallet);
};

main();
