import "../styles/globals.css"
import "@rainbow-me/rainbowkit/styles.css"
import type { AppProps } from "next/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { config } from "../wagmi"
import { useRouter } from "next/router"
import Header from "../components/Header"
import { userStore } from "../stores/userStore"
import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import withContainer from "../utils/with-container"

const client = new QueryClient()

function MyApp({ Component, pageProps }: AppProps) {
  const {
    userInfo,
    isRegistered,
    walletAddress,
    isWalletConnected,
    // checkRegistrationStatus,
  } = userStore.useContainer()
  const router = useRouter()

  useEffect(() => {
    if (walletAddress === "") {
      router.push("/login")
    }
    if (walletAddress !== "") {
      router.push("/")
    }
  }, [walletAddress])
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
          <userStore.Provider>
            {router.pathname !== "/login" && <Header />}
            <Component {...pageProps} />
          </userStore.Provider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

const ConfigStoreContainer = withContainer(userStore)
export default ConfigStoreContainer(MyApp)
