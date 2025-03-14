import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { userStore } from "../../stores/userStore"
import styles from "./styles.module.css"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/router"
import { Button } from "@mui/material"

const Header: React.FC = observer(() => {
  const { userInfo, walletAddress, setWalletAddress } = userStore.useContainer()

  const router = useRouter()

  return (
    <header className={styles.header}>
      <h2 className={styles.logo}>MyPet</h2>
      <div className={styles.rightSection}>
        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            // openChainModal,
            // openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading"
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated")
            useEffect(() => {
              if (connected) {
                setWalletAddress(account.address)
                router.push("/")
              } else {
                router.push("/login")
              }
            }, [connected])
            return (
              <>
                <ConnectButton accountStatus="avatar" chainStatus="none" />
              </>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
})

export default Header
