import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const sepoliaRpc =
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ??
  "https://ethereum-sepolia-rpc.publicnode.com";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  ssr: true,
  transports: {
    [sepolia.id]: http(sepoliaRpc),
  },
});
