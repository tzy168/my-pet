import React, { useEffect } from "react"
import { useWalletClient } from "wagmi"
import { ethers } from "ethers"
import { useGlobalStore } from "../../stores/global"

interface WalletInitializerProps {
  children: React.ReactNode
}
const WalletInitializer: React.FC<WalletInitializerProps> = ({ children }) => {
  const { data: walletClient } = useWalletClient()
  const { initContract } = useGlobalStore()

  useEffect(() => {
    if (walletClient) {
      const initializeContract = async () => {
        const signer = await new ethers.BrowserProvider(
          walletClient
        ).getSigner()
        initContract(signer)
      }
      initializeContract()
    }
  }, [walletClient, initContract])

  return <>{children}</>
}

export default WalletInitializer
