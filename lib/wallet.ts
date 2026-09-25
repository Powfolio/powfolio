const WC_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "b13c572504133be2ba2adc2011d7e95f";

type EthRequest = (args: { method: string; params?: unknown[] }) => Promise<unknown>;

let lastProvider: { request: EthRequest } | null = null;

function injectedProvider() {
  return (
    window as unknown as {
      ethereum?: { request: EthRequest };
    }
  ).ethereum;
}

export async function connectEthereumWallet(): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Wallet connect only works in the browser");
  }

  const eth = injectedProvider();

  if (eth) {
    const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    const address = accounts?.[0];
    if (!address) throw new Error("Wallet connection cancelled");
    lastProvider = eth;
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
        icons: ["https://pow3folio.vercel.app/folio-mark.png"],
      },
    });

    await provider.enable();
    const accounts = provider.accounts;
    const address = accounts?.[0];
    if (!address) throw new Error("Wallet connection cancelled");
    lastProvider = { request: (args) => provider.request(args) as Promise<unknown> };
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

export async function signWalletMessage(address: string, message: string): Promise<string> {
  const provider = lastProvider || injectedProvider();
  if (!provider) {
    throw new Error("No wallet is connected. Reconnect and try again.");
  }
  const signature = await provider.request({
    method: "personal_sign",
    params: [message, address],
  });
  if (typeof signature !== "string" || !signature) {
    throw new Error("Wallet signature was cancelled");
  }
  return signature;
}
