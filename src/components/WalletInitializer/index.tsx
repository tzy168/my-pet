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
    contract
  } = useGlobalStore()

  useEffect(() => {
    if (walletClient) {
      const initializeContract = async () => {
        const signer = await new ethers.BrowserProvider(
          walletClient
        ).getSigner()
        await initContract(signer)
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
        }
      } catch (error) {
        console.error("检查用户状态失败:", error)
      }
    }

    checkUserStatus()
  }, [contract, isConnected, checkRegisteredAddress, getUserInfo])

  useEffect(() => {
    const isProfilePage = router.pathname === "/profile"
    const hasConnectedBefore = localStorage.getItem('hasConnectedBefore')

    if (isConnected && !isRegistered && !isProfilePage && !hasConnectedBefore && router.pathname !== '/') {
      localStorage.setItem('hasConnectedBefore', 'true')
      router.push("/profile")
      return
    }
  }, [isConnected, isRegistered, router.pathname])

  // 检测页面刷新
  useEffect(() => {
    // 页面加载时设置刷新标志
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('isPageRefresh', 'true')
    }
    
    // 页面卸载前清除刷新标志
    const handleBeforeUnload = () => {
      // 如果是导航到其他页面，会在新页面加载时重新设置标志
      // 如果是刷新，标志会保持为true
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload)
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    }
  }, [])

  return <>{children}</>
}

export default WalletInitializer
