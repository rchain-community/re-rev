import './App.css';
import { useState, useEffect } from 'react';
import { formatBalance, formatChainAsNum } from './utils';
import detectEthereumProvider from '@metamask/detect-provider';

const App = () => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [], balance: '', chainId: '' };
  const [wallet, setWallet] = useState(initialState);

  const [isConnecting, setIsConnecting] = useState(false); /* New */
  const [error, setError] = useState(false); /* New */
  const [errorMessage, setErrorMessage] = useState(''); /* New */

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
    </div>
  );
};

export default App;
