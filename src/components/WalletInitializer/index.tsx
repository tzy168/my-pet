import React, { useEffect } from "react"
import { useWalletClient } from "wagmi"
import { useAccount } from "wagmi"
import { ethers } from "ethers"
import { useGlobalStore } from "../../stores/global"
import { useRouter } from "next/router"

interface WalletInitializerProps {
  children: React.ReactNode
}
const WalletInitializer: React.FC<WalletInitializerProps> = ({ children }) => {
  const { data: walletClient } = useWalletClient()
  const { isConnected, address } = useAccount()
  const router = useRouter()
  const {
    initContract,
    setWalletAddress,
    checkRegisteredAddress,
    isRegistered,
    getUserInfo,
    contract,
  } = useGlobalStore()

  useEffect(() => {
    if (walletClient) {
      const initializeContract = async () => {
        try {
          const signer = await new ethers.BrowserProvider(
            walletClient
          ).getSigner()
          const success = await initContract(signer)
          if (!success) {
            console.error("合约初始化失败，请刷新页面或重新连接钱包")
          }
        } catch (error) {
          console.error("初始化合约时发生错误:", error)
        }
      }
      initializeContract()
    }
  }, [walletClient, initContract])

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address)
    }
  }, [isConnected, address, setWalletAddress])

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!contract || !isConnected) return

      try {
        const isUserRegistered = await checkRegisteredAddress()
        if (isUserRegistered) {
          await getUserInfo()
        } else if (router.pathname !== "/profile") {
          // 未注册用户直接跳转到个人资料页面
          router.push("/profile")
        }
      } catch (error) {
        console.error("检查用户状态失败:", error)
      }
    }

    checkUserStatus()
  }, [contract, isConnected, checkRegisteredAddress, getUserInfo, router])

  return <>{children}</>
}

export default WalletInitializer
