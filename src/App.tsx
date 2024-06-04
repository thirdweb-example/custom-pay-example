import { useState } from "react";
import {
  BuyWithCryptoQuote,
  createThirdwebClient,
  getBuyWithCryptoQuote,
  NATIVE_TOKEN_ADDRESS,
  sendAndConfirmTransaction,
} from "thirdweb";
import { avalanche } from "thirdweb/chains";
import { BuyWithFiatQuote, getBuyWithFiatQuote } from "thirdweb/pay";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { stringify } from "thirdweb/utils";

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_CLIENT_ID,
});

function App() {
  const [purchaseOption, setPurchaseOption] = useState<"fiat" | "crypto">(
    "fiat"
  );
  const [fiatQuote, setFiatQuote] = useState<BuyWithFiatQuote | null>(null);
  const [cryptoQuote, setCryptoQuote] = useState<BuyWithCryptoQuote | null>(
    null
  );
  const account = useActiveAccount();
  const [isLoading, setLoading] = useState(false);
  return (
    <div className="flex flex-col min-h-[100dvh] py-10">
      <div className="m-auto flex flex-col gap-5">
        <div>
          <button
            className={`${
              purchaseOption === "fiat"
                ? "bg-purple-600 text-white"
                : "bg-white text-black"
            } px-4 py-2`}
            onClick={() => {
              setPurchaseOption("fiat");
              setFiatQuote(null);
              setLoading(false);
            }}
          >
            Purchase with Fiat
          </button>
          <button
            className={`${
              purchaseOption === "crypto"
                ? "bg-purple-600 text-white"
                : "bg-white text-black"
            } px-4 py-2`}
            onClick={() => {
              setPurchaseOption("crypto");
              setCryptoQuote(null);
              setLoading(false);
            }}
          >
            Purchase with Crypto
          </button>
        </div>
        {account ? (
          <>
            <div>
              <ConnectButton client={client} />
            </div>
            {purchaseOption === "fiat" ? (
              <div>
                <div>Step 1: Get fiat quote for a purchase of 50 AVAX</div>
                <div>
                  <button
                    className="border px-4 py-1"
                    onClick={async () => {
                      setLoading(true);
                      const _quote = await getBuyWithFiatQuote({
                        client: client, // thirdweb client
                        fromCurrencySymbol: "USD", // fiat currency symbol
                        toChainId: avalanche.id, // base chain id
                        toAmount: "50", // amount of token to buy
                        toTokenAddress: NATIVE_TOKEN_ADDRESS, // native token
                        toAddress: account.address, // user's wallet address
                      });
                      setFiatQuote(_quote);
                      setLoading(false);
                    }}
                  >
                    {isLoading ? "Loading..." : "Get quote"}
                  </button>

                  {fiatQuote && (
                    <>
                      <div className="mt-5">Quote content:</div>
                      <pre className="max-w-[500px] max-h-[400px] overflow-auto border">
                        {JSON.stringify(fiatQuote, null, 2)}
                      </pre>

                      <div className="mt-12">
                        Step 2: Open the onRampLink (you can also use an
                        embedded iframe for your app)
                      </div>
                      <div>
                        <button
                          className="border px-4 py-2"
                          onClick={() =>
                            window.open(fiatQuote.onRampLink, "_blank")
                          }
                        >
                          Open {"{fiatQuote.onRampLink}"}
                        </button>
                      </div>
                      <div className="mt-12">
                        Step 3: Finish the purchase in the Onramp Experience
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div>
                  Step 1: Get crypto quote for a purchase of 0.5 AVAX - using
                  USDC on AVAX
                </div>
                <button
                  className="border px-4 py-1"
                  onClick={async () => {
                    setLoading(true);
                    const _quote = await getBuyWithCryptoQuote({
                      client,
                      fromAddress: account.address, // wallet address
                      fromChainId: avalanche.id, // chain id of the source token
                      fromTokenAddress:
                        "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // token address of the source token - USDC in this case
                      // fromAmount: "10", // amount of source token to swap
                      toAmount: "0.5",
                      // optionally, you can use `toAmount` instead if you only want a certain amount of destination token
                      toChainId: avalanche.id, // chain id of the destination token
                      toTokenAddress: NATIVE_TOKEN_ADDRESS, // token address of the destination token
                      // toAddress: "0x...", // optional: send the tokens to a different address
                      maxSlippageBPS: 50, // optional: max 0.5% slippage
                    });
                    setLoading(false);
                    setCryptoQuote(_quote);
                  }}
                >
                  {isLoading ? "Loading..." : "Get quote"}
                </button>

                {cryptoQuote && (
                  <>
                    <div className="mt-5">Quote content:</div>
                    <pre className="max-w-[500px] max-h-[400px] overflow-auto border">
                      {JSON.stringify(
                        JSON.parse(stringify(cryptoQuote)),
                        null,
                        2
                      )}
                    </pre>

                    <div className="mt-12">
                      Step 2: Execute Buy with Crypto
                      <br />
                      If you are buying with an ERC20 token (like USDC) - an
                      approval step is required
                    </div>
                    {cryptoQuote.approval && (
                      <>
                        <div className="mt-8 ml-5">
                          Step 2a: Approve USDC spending
                        </div>
                        {/* You could also use the TransactionButton for this */}
                        <button
                          className="px-4 py-2 border ml-5"
                          onClick={async () => {
                            await sendAndConfirmTransaction({
                              // @ts-ignore TODO Fix later
                              transaction: cryptoQuote.approval,
                              account,
                            });
                          }}
                        >
                          Approve
                        </button>

                        <div className="mt-8 ml-5">
                          Step 2b: Make the purchase (make sure you have
                          approved the spending)
                        </div>
                        {/* You could also use the TransactionButton for this */}
                        <button
                          className="px-4 py-2 border ml-5"
                          onClick={async () => {
                            await sendAndConfirmTransaction({
                              // @ts-ignore TODO Fix later
                              transaction: cryptoQuote.transactionRequest,
                              account,
                            });
                          }}
                        >
                          Buy now
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="m-auto">
            <ConnectButton client={client} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
