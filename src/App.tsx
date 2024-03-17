import './App.css';
import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { formatBalance, formatChainAsNum } from './utils';
import { Base16 } from './codec.js';
import {
  recoverPublicKey,
  personalDigest,
  getAddrFromEth,
  pubKeyToCosmosAddr,
} from './convert-addr.js';

const App = () => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: '', chainId: '' };
  const [wallet, setWallet] = useState(initialState);

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [publicKey, setPublicKey] = useState(null);

  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts);
      } else {
        // if length 0, user is disconnected
        setWallet(initialState);
      }
    };

    const refreshChain = (chainId: any) => {
      setWallet(wallet => ({ ...wallet, chainId }));
    };

    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));

      if (provider) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        refreshAccounts(accounts);
        window.ethereum.on('accountsChanged', refreshAccounts);
        window.ethereum.on('chainChanged', refreshChain);
      }
    };

    getProvider();

    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts);
      window.ethereum?.removeListener('chainChanged', refreshChain);
    };
  }, []);

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum!.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest'],
      }),
    );
    const chainId = await window.ethereum!.request({
      method: 'eth_chainId',
    });
    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum
      .request({
        method: 'eth_requestAccounts',
      })
      .then((accounts: []) => {
        setError(false);
        updateWallet(accounts);
      })
      .catch((err: any) => {
        setError(true);
        setErrorMessage(err.message);
      });
    setIsConnecting(false);
  };

  const disableConnect = Boolean(wallet) && isConnecting;

  const siweSign = async (siweMessage: string) => {
    try {
      const from = wallet.accounts[0];
      const msg = `0x${Base16.encodeText(siweMessage)}`;
      const { digest } = personalDigest(msg);
      console.log('@@sign', { from, msg, digest });
      const sign = await window.ethereum.request({
        method: 'personal_sign',
        params: [msg, from],
      });

      const publicKey = recoverPublicKey(msg, sign);
      console.log('@@@', { sign, publicKey });
      setPublicKey(publicKey);
    } catch (err) {
      setError(true);
      err instanceof Error && setErrorMessage(err.message);
    }
  };

  const signIn = async (location: typeof window.location) => {
    const from = wallet.accounts[0];
    const siweMessage = `${location.origin} wants you to sign in with your Ethereum account:\n${from}\n\nI accept the MetaMask Terms of Service: https://community.metamask.io/tos\n\nURI: ${location.origin}\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z`;
    // const siweMessage = 'reREV';
    siweSign(siweMessage);
  };

  return (
    <div className="App">
      <h1>reREV (WIP)</h1>

      <div className="debug">
        Injected Provider {hasProvider ? 'DOES' : 'DOES NOT'} Exist
      </div>

      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <button disabled={disableConnect} onClick={handleConnect}>
          Connect ETH Provider
        </button>
      )}

      {wallet.accounts.length > 0 && (
        <fieldset>
          <label>
            ETH Address: <input value={wallet.accounts[0]} readOnly size={44} />
          </label>
          <br />
          <label>
            REV Address:{' '}
            <input
              value={getAddrFromEth(wallet.accounts[0])}
              readOnly
              size={44}
            />
          </label>
          <br />
          <div className="debug">Wallet Balance: {wallet.balance}</div>
          <div className="debug">Hex ChainId: {wallet.chainId}</div>
          <div className="debug">
            Numeric ChainId: {formatChainAsNum(wallet.chainId)}
          </div>
        </fieldset>
      )}
      {error /* New code block */ && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <button
        type="button"
        id="siwe"
        disabled={wallet.accounts.length === 0}
        onClick={() => signIn(window.location)}
      >
        Sign-In
      </button>
      {publicKey && (
        <fieldset>
          <label>
            Public Key: <input value={publicKey} readOnly size={64} />
          </label>
          <br />
          <label>
            Juno Address*:{' '}
            <input
              value={pubKeyToCosmosAddr(publicKey, 'juno')}
              readOnly
              size={64}
            />
          </label>
          <p>
            <strong>* with coinType 60</strong>
          </p>
        </fieldset>
      )}
    </div>
  );
};

export default App;
