import "../styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import type { AppProps } from "next/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { config } from "../wagmi"
import { useRouter } from "next/router"
import Header from "../components/Header"
import WalletInitializer from "../components/WalletInitializer"

const client = new QueryClient()

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const isLoginPage = router.pathname === "/login"

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <WalletInitializer>
            {!isLoginPage && <Header />}
            <div
              style={{
                width: "100%",
                height: "calc(100vh - 64px)",
                minWidth: "1200px",
                padding: "10px",
                borderRadius: "8px",
              }}
            >
              <Component {...pageProps} />
            </div>
          </WalletInitializer>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default MyApp
