import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const upstreamRpc =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

// Browser reads must go through same-origin proxy: COEP (required for FHE WASM)
// blocks cross-origin fetch to Alchemy/public RPC endpoints.
const sepoliaRpc =
  typeof window === "undefined" ? upstreamRpc : "/api/rpc";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(sepoliaRpc),
  },
});
