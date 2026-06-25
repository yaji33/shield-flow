import { createConfig, http, type Config } from "wagmi";
import { sepolia } from "wagmi/chains";

// All client reads go through same-origin proxy. COEP (required for FHE WASM)
// blocks cross-origin fetch to Alchemy/public RPC endpoints from the browser.
const sepoliaRpc = "/api/rpc";

let wagmiConfig: Config | undefined;

export function getWagmiConfig(): Config {
  if (!wagmiConfig) {
    wagmiConfig = createConfig({
      chains: [sepolia],
      ssr: false,
      transports: {
        [sepolia.id]: http(sepoliaRpc),
      },
    });
  }
  return wagmiConfig;
}
