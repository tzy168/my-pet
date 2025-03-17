import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/router"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import styles from "../styles/Login.module.css"
import { useAccount } from "wagmi"
import { useGlobalStore } from "../stores/global"

const Login: React.FC = () => {
  const router = useRouter()
  const { isRegistered, walletAddress, setWalletAddress } = useGlobalStore()
  const { isConnected, address } = useAccount()
  useEffect(() => {
    if (isConnected && !isRegistered) {
      setWalletAddress(address!)
      router.push("/register")
    }
  }, [isConnected])
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>欢迎使用 MyPet</h1>
        <div className={styles.walletConnect}>
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}

export default observer(Login)
