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
import Head from "next/head"
import { observer } from "mobx-react-lite"

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
        <RainbowKitProvider
          appInfo={{
            appName: "Rainbowkit Demo",
          }}
        >
          <WalletInitializer>
            <Spin />
            <Header />
            <Head>
              <title>My Pet</title>
              <link rel="icon" href="/favicon.ico" />
            </Head>
            <div
              style={{
                width: "100%",
                height: "calc(100vh - 64px)",
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

export default observer(MyApp)
