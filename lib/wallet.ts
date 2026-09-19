const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "b13c572504133be2ba2adc2011d7e95f";

export async function connectEthereumWallet(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connect only works in the browser");
  }

  const eth = (
    window as unknown as {
      ethereum?: {
        request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
      };
    }
  ).ethereum;

  if (eth) {
    const accounts = await eth.request({ method: "eth_requestAccounts" });
    const address = accounts?.[0];
    if (!address) throw new Error("Wallet connection cancelled");
    return address.toLowerCase();
  }

  try {
    const { default: EthereumProvider } = await import(
      "@walletconnect/ethereum-provider"
    );

    const provider = await EthereumProvider.init({
      projectId: WC_PROJECT_ID,
      chains: [1],
      optionalChains: [1, 8453, 42161, 10],
      showQrModal: true,
      methods: ["eth_requestAccounts", "eth_accounts", "personal_sign"],
      events: ["chainChanged", "accountsChanged"],
      metadata: {
        name: "Powfolio",
        description: "Proof of work portfolio for Web3 builders",
        url: "https://pow3folio.vercel.app",
        icons: ["https://pow3folio.vercel.app/icon.svg"],
      },
    });

    await provider.enable();
    const accounts = provider.accounts;
    const address = accounts?.[0];
    if (!address) throw new Error("Wallet connection cancelled");
    return address.toLowerCase();
  } catch (err) {
    if (err instanceof Error && err.message.toLowerCase().includes("cancelled")) {
      throw err;
    }
    throw new Error(
      err instanceof Error
        ? err.message
        : "No wallet found. Install MetaMask or scan with WalletConnect."
    );
  }
}
