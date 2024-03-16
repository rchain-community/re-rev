import './App.css';
import { useState, useEffect } from 'react';
import { formatBalance, formatChainAsNum } from './utils';
import { Base16 } from './codec';
import detectEthereumProvider from '@metamask/detect-provider';
import { useSDK } from '@metamask/sdk-react';

const App = () => {
  const { sdk } = useSDK();
  // const { sdk, connected, connecting, provider, chainId, account, balance } = useSDK();

  const [signedMessage, setSignedMessage] = useState('');

  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: '', chainId: '' };
  const [wallet, setWallet] = useState(initialState);

  const [isConnecting, setIsConnecting] = useState(false); /* New */
  const [error, setError] = useState(false); /* New */
  const [errorMessage, setErrorMessage] = useState(''); /* New */

  const [swieResult, setSwieResult] = useState(null);

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
    /* Updated */
    setIsConnecting(true); /* New */
    await window.ethereum
      .request({
        /* Updated */ method: 'eth_requestAccounts',
      })
      .then((accounts: []) => {
        /* New */
        setError(false); /* New */
        updateWallet(accounts); /* New */
      }) /* New */
      .catch((err: any) => {
        /* New */
        setError(true); /* New */
        setErrorMessage(err.message); /* New */
      }); /* New */
    setIsConnecting(false); /* New */
  };

  const disableConnect = Boolean(wallet) && isConnecting;

  const fail = (msg: string) => {
    throw new Error(msg);
  };

  const siweSign = async (siweMessage: string) => {
    const $ = (sel: string) => document.querySelector(sel) || fail(sel);
    try {
      const from = wallet.accounts[0];
      const msg = `0x${Base16.encodeText(siweMessage)}`;
      const fullMsg = `\x19Ethereum Signed Message:\n${siweMessage.length}${siweMessage}`;
      console.log('@@sign', {
        from,
        msg,
        fullMsg,
        fullHex: Base16.encodeText(fullMsg),
      });
      const sign = await window.ethereum.request({
        method: 'personal_sign',
        params: [msg, from],
      });
      setSwieResult(sign);
    } catch (err) {
      console.error(err);
      setSwieResult(err.message);
    }
  };

  const signIn = async (location: typeof window.location) => {
    const from = wallet.accounts[0];
    // const siweMessage = `${location.origin} wants you to sign in with your Ethereum account:\n${from}\n\nI accept the MetaMask Terms of Service: https://community.metamask.io/tos\n\nURI: ${location.origin}\nVersion: 1\nChain ID: 1\nNonce: 32891757\nIssued At: 2021-09-30T16:25:24.000Z`;
    const siweMessage = 'reREV';
    siweSign(siweMessage);
  };

  const signIn2 = async () => {
    try {
      const message = 'Your message here';
      const signature = await sdk?.connectAndSign({ msg: message });
      setSignedMessage(signature);
    } catch (error) {
      setError(true);
      setErrorMessage(
        `Error in signing:, ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
    }
  };

  return (
    <div className="App">
      <div>Injected Provider {hasProvider ? 'DOES' : 'DOES NOT'} Exist</div>

      {window.ethereum?.isMetaMask &&
        wallet.accounts.length < 1 /* Updated */ && (
          <button disabled={disableConnect} onClick={handleConnect}>
            Connect MetaMask
          </button>
        )}

      {wallet.accounts.length > 0 && (
        <>
          <div>Wallet Accounts: {wallet.accounts[0]}</div>
          <div>Wallet Balance: {wallet.balance}</div>
          <div>Hex ChainId: {wallet.chainId}</div>
          <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
        </>
      )}
      {error /* New code block */ && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <h2>Sign-In</h2>
      <button type="button" onClick={signIn2}>
        Sign In
      </button>
      {signedMessage && <p>Signed Message: {signedMessage}</p>}

      <h4>Sign-In with Ethereum</h4>
      <button
        type="button"
        id="siwe"
        disabled={wallet.accounts.length === 0}
        onClick={() => signIn(window.location)}
      >
        Sign-In with Ethereum
      </button>
      <p className="alert">
        Result:<span id="siweResult">{swieResult}</span>
      </p>
    </div>
  );
};

export default App;
