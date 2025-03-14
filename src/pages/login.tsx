import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/router"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { userStore } from "../stores/userStore"
import styles from "../styles/Login.module.css"
import { Button } from "@mui/material"

const Login: React.FC = () => {
  const router = useRouter()
  const { isWalletConnected, walletAddress, isRegistered, setWalletAddress } =
    userStore.useContainer()

  // useEffect(() => {
  //   if (isWalletConnected && walletAddress && isRegistered) {
  //     router.push("/")
  //   }
  // }, [isWalletConnected, walletAddress, isRegistered, router])

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>欢迎使用 MyPet</h1>
        <div className={styles.walletConnect}>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
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
                  setWalletAddress(walletAddress)
                  router.push("/")
                }
              }, [connected, walletAddress])
              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={openConnectModal}
                          sx={{
                            padding: "10px 20px",
                            fontSize: "1rem",
                            textTransform: "none",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            "&:hover": {
                              boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                            },
                          }}
                        >
                          Connect Wallet
                        </Button>
                      )
                    }

                    if (chain.unsupported) {
                      return (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={openChainModal}
                          sx={{
                            padding: "10px 20px",
                            fontSize: "1rem",
                            textTransform: "none",
                            borderRadius: "8px",
                          }}
                        >
                          Wrong network
                        </Button>
                      )
                    }

                    return (
                      <div style={{ display: "flex", gap: 12 }}>
                        <Button
                          variant="outlined"
                          onClick={openChainModal}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            padding: "8px 16px",
                            fontSize: "0.9rem",
                            textTransform: "none",
                            borderRadius: "8px",
                            mr: 1,
                          }}
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                overflow: "hidden",
                                marginRight: 4,
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? "Chain icon"}
                                  src={chain.iconUrl}
                                  style={{ width: 12, height: 12 }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </Button>

                        <Button
                          variant="contained"
                          onClick={openAccountModal}
                          sx={{
                            padding: "8px 16px",
                            fontSize: "0.9rem",
                            textTransform: "none",
                            borderRadius: "8px",
                          }}
                        >
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ""}
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </div>
  )
}

export default observer(Login)
