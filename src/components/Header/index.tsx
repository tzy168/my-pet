import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import styles from "./styles.module.css"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/router"
import { useGlobalStore } from "../../stores/global"

const Header: React.FC = observer(() => {
  const { setWalletAddress, isRegistered } = useGlobalStore()
  const router = useRouter()

  return (
    <header className={styles.header}>
      <h2 className={styles.logo}>MyPet</h2>
      <div className={styles.rightSection}>
        <ConnectButton.Custom>
          {({ account, chain, authenticationStatus, mounted }) => {
            const ready = mounted && authenticationStatus !== "loading"
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated")
            useEffect(() => {
              if (connected && isRegistered) {
                setWalletAddress(account.address)
                router.push("/")
              } else if (!connected) {
                router.push("/login")
              } else if (connected && !isRegistered) {
                router.push("/register")
              }
            }, [connected])
            return (
              <>
                <ConnectButton accountStatus="address" chainStatus="none" />
              </>
            )
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  )
})

export default Header
