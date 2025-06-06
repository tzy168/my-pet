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
    getUserInfo,
    contract,
    userContract,
    setLoading,
  } = useGlobalStore()

  useEffect(() => {
    if (walletClient) {
      const initializeContract = async () => {
        try {
          setLoading(true)
          const signer = await new ethers.BrowserProvider(
            walletClient
          ).getSigner()
          const success = await initContract(signer)
          if (!success) {
            console.error("合约初始化失败，请刷新页面或重新连接钱包")
          }
          setLoading(false)
        } catch (error) {
          setLoading(false)
          console.error("初始化合约时发生错误:", error)
        }
      }
      initializeContract()
    }
  }, [walletClient, initContract, setLoading])

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address)
    } else if (!isConnected) {
      // 当钱包断开连接时，清除钱包地址
      setWalletAddress("")
    }
  }, [isConnected, address, setWalletAddress])

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!userContract || !address) return

      try {
        const isUserRegistered =
          await userContract.checkUserIsRegistered(address)
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
  }, [userContract, address, getUserInfo, router])

  return <>{children}</>
}

export default WalletInitializer
