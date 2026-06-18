"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain, injected } from "wagmi";
import { sepolia } from "wagmi/chains";

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending: isConnecting, error: connectError } =
    useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const isWrongChain = isConnected && chain?.id !== sepolia.id;

  const connectWallet = async () => {
    connect(
      { connector: injected(), chainId: sepolia.id },
      {
        onSuccess: ({ accounts, chainId }) => {
          if (chainId !== sepolia.id && accounts[0]) {
            switchChain({ chainId: sepolia.id });
          }
        },
      },
    );
  };

  const switchToSepolia = () => switchChain({ chainId: sepolia.id });

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  return {
    address,
    shortAddress,
    isConnected,
    isConnecting,
    isSwitching,
    isWrongChain,
    chain,
    connectWallet,
    switchToSepolia,
    disconnect,
    connectError,
  };
}
