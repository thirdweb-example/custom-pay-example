import { useState } from "react";
import { Bridge, defineChain, NATIVE_TOKEN_ADDRESS, sendTransaction, toTokens, toWei } from "thirdweb";
import { Check } from "lucide-react";
import { client } from "@/app/client";
import { useActiveAccount } from "thirdweb/react";

// Assuming `client` is already initialized with thirdweb

export function BuyWithCrypto() {
  const account = useActiveAccount();
  const [loading, setLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState<"COMPLETED" | "PENDING" | "FAILED" | "NOT_FOUND" | null>(null);
  const [error, setError] = useState<string | null>(null); 
  
  const amount = "0.000001"; // 1000 wei in AVAX
  const originChainId = 8453;
  const destinationChainId = 8453;
  const destinationTokenAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"; 

  async function handleSwap() {
    setLoading(true);
    setError(null);
    setSwapStatus(null);
    if (!account) return;
    try {
      // Step 1: Get Quote for the swap
      const buyQuote = await Bridge.Buy.quote({
        originChainId: originChainId,
        originTokenAddress: NATIVE_TOKEN_ADDRESS, // AVAX token
        destinationChainId: destinationChainId,
        destinationTokenAddress: destinationTokenAddress, // USDC on AVAX (ERC-20)
        buyAmountWei: BigInt("1000"), // 0.5 AVAX, converted to wei
        client,
      });
      console.log(buyQuote)

      // Step 2: Prepare the transaction
      const preparedBuy = await Bridge.Buy.prepare({
        originChainId: originChainId,
        originTokenAddress: NATIVE_TOKEN_ADDRESS,
        destinationChainId: destinationChainId,
        destinationTokenAddress: destinationTokenAddress,
        amount: BigInt("1000"),
        sender: account?.address, 
        receiver: account?.address, 
        client,
      });

      // Step 3: Execute the prepared transactions
      for (const transaction of preparedBuy.steps[0].transactions) {
        const tx = {
          to: transaction.to as string,
          value: BigInt(transaction.value ?? 0n),
          data: transaction.data,
          chain: defineChain(transaction.chainId),
          client
        };

        const result = await sendTransaction({ transaction: tx, account: account }); 

        let status;
        do {
          status = await Bridge.status({
              transactionHash: result.transactionHash,
              client,
              chainId:  originChainId
          });
          setSwapStatus(status.status);
        } while (status.status !== "COMPLETED");
      }

      setSwapStatus("COMPLETED");
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto bg-black border border-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-black p-6 text-white border-b border-white">
        <h2 className="text-2xl font-bold">Buy Crypto with AVAX</h2>
        <p className="text-white">Amount: {amount} AVAX → USDC on AVAX</p>
      </div>

      <div className="p-6 space-y-6">
        <button
          onClick={handleSwap}
          disabled={loading}
          className="w-full py-3 px-4 rounded-lg bg-black hover:bg-white hover:text-black text-white font-medium transition-all border border-white flex items-center justify-center gap-2"
        >
          {loading ? "Processing..." : "Start Swap"}
        </button>

        {swapStatus && (
          <div className="mt-4 text-white">
            <p>Status: {swapStatus}</p>
            {swapStatus === "COMPLETED" && (
              <div className="flex justify-center mt-4">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}
      </div>

      <div className="border-t border-white p-4 bg-black text-center text-xs text-white">
        Powered by thirdweb - Universal Bridge
      </div>
    </div>
  );
}
