"use client";

import { useState } from "react";
import { ConnectButton, useLinkProfile } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
import { defineChain, sepolia } from "thirdweb/chains"; // or your preferred chain
import { client } from "./client";
import { BuyWithFiat } from "./components/feature/buyWithFiat";
import { BuyWithCrypto } from "./components/feature/buyWithCrypto";
import { abstractWallet } from "@abstract-foundation/agw-react/thirdweb"

export default function Home() {
  const { mutate: linkProfile, isPending, error, isSuccess } = useLinkProfile();

  const handleLinkAbstract = () => {
    linkProfile({
      client,
      strategy: "wallet",
      wallet: abstractWallet(), // Abstract wallet by ID
      chain: defineChain(2741), // Required for SIWE signature
    });
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center bg-black text-white container max-w-screen-lg mx-auto">
      <div className="py-20 space-y-12 w-full">
        <div className="flex flex-col items-center space-y-6">
          <ConnectButton client={client}/>

          <button
            onClick={handleLinkAbstract}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
            disabled={isPending}
          >
            {isPending ? "Linking..." : "Link Abstract Wallet"}
          </button>
          {isSuccess && <div className="text-green-400">Abstract wallet linked!</div>}
          {error && <div className="text-red-400">Error: {error.message}</div>}

          <div className="flex justify-center space-x-6 w-full">
            <BuyWithFiat />
            <BuyWithCrypto />
          </div>
        </div>
      </div>
    </main>
  );
}
