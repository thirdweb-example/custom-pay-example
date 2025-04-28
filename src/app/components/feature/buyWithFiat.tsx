import { BuyWithFiatQuote, BuyWithFiatStatus, BuyWithCryptoQuote, getBuyWithFiatQuote, getBuyWithFiatStatus, getPostOnRampQuote, getBuyWithCryptoStatus, getBuyWithCryptoQuote, isSwapRequiredPostOnramp } from "thirdweb/pay";
import { getContract, NATIVE_TOKEN_ADDRESS, sendAndConfirmTransaction } from "thirdweb";
import { approve } from "thirdweb/extensions/erc20";
import { useActiveAccount } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { useState } from "react";
import { client } from "@/app/client";
import { Check } from "lucide-react";

export function BuyWithFiat() {
    const account = useActiveAccount();
    const [quote, setQuote] = useState<BuyWithFiatQuote>();
    const [fiatStatus, setFiatStatus] = useState<BuyWithFiatStatus>();
    const [swapQuote, setSwapQuote] = useState<BuyWithCryptoQuote>();
    const [buyTxHash, setBuyTxHash] = useState<string | null>(null);

    async function fetchQuote() {
        if (!account) return;
        const result = await getBuyWithFiatQuote({
            client,
            fromCurrencySymbol: "USD",
            toChainId: base.id,
            toAmount: "0.1",
            toTokenAddress: NATIVE_TOKEN_ADDRESS,
            toAddress: account?.address,
            fromAddress: account?.address,
            isTestMode: true
        });
        setQuote(result);
        if (result?.onRampLink) window.open(result.onRampLink, "_blank");
    }

    async function checkFiatStatus() {
        if (!quote) return;
        const status = await getBuyWithFiatStatus({ client, intentId: quote.intentId });
        setFiatStatus(status);
        if (status.status === "CRYPTO_SWAP_REQUIRED") {
            const swap = await getPostOnRampQuote({ client, buyWithFiatStatus: status });
            setSwapQuote(swap);
        }
    }

    async function handleBuyWithCrypto() {
        if (!swapQuote || !account) return;
        if (swapQuote.approvalData) {
            const contract = getContract({ client, chain: base, address: swapQuote.approvalData.tokenAddress });
            const transaction = approve({ contract, spender: swapQuote.approvalData.spenderAddress, amountWei: BigInt(swapQuote.approvalData.amountWei) });
            await sendAndConfirmTransaction({ transaction, account });
        }
        const buyTx = await sendAndConfirmTransaction({ transaction: swapQuote.transactionRequest, account });
        setBuyTxHash(buyTx.transactionHash);
        pollCryptoStatus();
    }

    async function pollCryptoStatus() {
        if (!buyTxHash) return;
        const interval = setInterval(async () => {
            const status = await getBuyWithCryptoStatus({ client, transactionHash: buyTxHash, chainId: base.id });
            console.log("Crypto Swap Status:", status);
            if (status.status === "COMPLETED" || status.status === "FAILED") clearInterval(interval);
        }, 5000);
    }

    return (
        <div className="w-full max-w-md mx-auto bg-black border border-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-black p-6 text-white border-b border-white">
                <h2 className="text-2xl font-bold">Buy Crypto with Fiat</h2>
                <p className="text-white">Amount: 0.1 USD → ETH on Base</p>
            </div>
            <div className="p-6 space-y-6">
                <button onClick={fetchQuote} disabled={quote ? true : false} className="w-full py-3 px-4 rounded-lg bg-black hover:bg-white hover:text-black text-white font-medium transition-all border border-white flex items-center justify-center gap-2">
                    {quote ? <Check className="w-5 h-5" /> : null} {quote ? "Quote Received" : "Get Fiat Quote"}
                </button>
                
                {quote && (
                    <button onClick={checkFiatStatus} className="w-full py-3 px-4 rounded-lg bg-black hover:bg-white hover:text-black text-white font-medium transition-all border border-white flex items-center justify-center gap-2">
                        {fiatStatus && fiatStatus.status != 'NONE' && (<Check className="w-5 h-5" />  )}
                        Transaction Status
                    </button>
                )}
                {fiatStatus && (
                    <div className="bg-black rounded-lg p-4 text-white border border-white">
                        <p>Status: {fiatStatus.status}</p>
                    </div>
                )}
                {fiatStatus?.status === "CRYPTO_SWAP_REQUIRED" && (
                    <button onClick={handleBuyWithCrypto} className="w-full py-3 px-4 rounded-lg bg-black hover:bg-white hover:text-black text-white font-medium transition-all border border-white flex items-center justify-center gap-2">
                        <Check className="w-5 h-5" /> Swap with Crypto
                    </button>
                )}
                {buyTxHash && (
                    <div className="bg-black rounded-lg p-4 text-white border border-white">
                        <p>Transaction Hash: {buyTxHash}</p>
                    </div>
                )}
            </div>
            <div className="border-t border-white p-4 bg-black text-center text-xs text-white">
                Powered by thirdweb - Universal Bridge
            </div>
        </div>
    );
}