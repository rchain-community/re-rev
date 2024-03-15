import './App.css';
import { useState, useEffect } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';

const App = () => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const initialState = { accounts: [] }; /* New */
  const [wallet, setWallet] = useState(initialState); /* New */

  useEffect(() => {
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true });
      setHasProvider(Boolean(provider));
    };

    getProvider();
  }, []);

  const updateWallet = async (accounts: any) => {
    /* New */
    setWallet({ accounts }); /* New */
  }; /* New */

  const handleConnect = async () => {
    /* New */
    const accounts = await window.ethereum.request({
      /* New */ method: 'eth_requestAccounts' /* New */,
    }); /* New */
    updateWallet(accounts); /* New */
  }; /* New */

  return (
    <div className="App">
      <div>Injected Provider {hasProvider ? 'DOES' : 'DOES NOT'} Exist</div>

      {hasProvider /* Updated */ && (
        <button onClick={handleConnect}>Connect MetaMask</button>
      )}

      {wallet.accounts.length > 0 /* New */ && (
        <div>Wallet Accounts: {wallet.accounts[0]}</div>
      )}
    </div>
  );
};

export default App;
