"use client";

import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { BuyWithFiat } from "./components/feature/buyWithFiat";
import { BuyWithCrypto } from "./components/feature/buyWithCrypto";
import { base } from "thirdweb/chains";

export default function Home() {
  

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center bg-black text-white container max-w-screen-lg mx-auto">
      <div className="py-20 space-y-12 w-full">
        <div className="flex flex-col items-center space-y-6">
          {/* Connect Button */}
          <ConnectButton client={client} chain={base} />

        

          <div className="flex justify-center space-x-6 w-full">
          <BuyWithFiat  />
          <BuyWithCrypto  />
          </div>
        </div>
      </div>
    </main>
  );
}
