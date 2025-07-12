import { PrivyProvider } from '@privy-io/react-auth';
import { privyConfig } from './privy-config';
import { MonadWalletConnect } from './MonadWalletConnect';

function App() {
  return (
    <PrivyProvider config={privyConfig}>
      <MonadWalletConnect />
    </PrivyProvider>
  );
}

export default App;
