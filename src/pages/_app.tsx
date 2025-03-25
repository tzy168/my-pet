import "../styles/globals.css"
import "../styles/theme.css"
import "@rainbow-me/rainbowkit/styles.css"
import type { AppProps } from "next/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { config } from "../wagmi"
import { useRouter } from "next/router"
import Header from "../components/Header"
import WalletInitializer from "../components/WalletInitializer"
import Spin from "../components/Spin"
import { useGlobalStore } from "../stores/global"
import { useEffect } from "react"

const client = new QueryClient()

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const { setLoading } = useGlobalStore()
  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleComplete = () => setLoading(false)

    router.events.on("routeChangeStart", handleStart)
    router.events.on("routeChangeComplete", handleComplete)
    router.events.on("routeChangeError", handleComplete)

    return () => {
      router.events.off("routeChangeStart", handleStart)
      router.events.off("routeChangeComplete", handleComplete)
      router.events.off("routeChangeError", handleComplete)
    }
  }, [router, setLoading])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <WalletInitializer>
            <Spin />
            <Header />
            <div
              style={{
                width: "100%",
                height: "calc(100vh - 64px)",
                // border: "2px solid #ccc",
                minWidth: "1200px",
                padding: "10px",
                borderRadius: "8px",
                marginTop: "58px",
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
