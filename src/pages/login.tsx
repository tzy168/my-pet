import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/router"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { userStore } from "../stores/userStore"
import styles from "../styles/Login.module.css"

const Login: React.FC = () => {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })

  const {
    isWalletConnected,
    isRegistered,
    walletAddress,
    registerUser,
    checkRegistrationStatus,
    setIsRegistered,
    setWalletAddress,
  } = userStore.useContainer()

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (walletAddress) {
      checkRegistrationStatus(walletAddress)
    }
  }, [walletAddress, checkRegistrationStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isWalletConnected || !walletAddress) return

    try {
      setIsLoading(true)
      setErrorMessage("")

      const success = await registerUser(
        formData.name,
        formData.email,
        formData.phone,
        formData.password
      )

      if (success) {
        setIsRegistered(true)
        router.push("/")
      } else {
        setErrorMessage("注册失败，请重试")
      }
    } catch (error) {
      console.error("注册失败:", error)
      setErrorMessage(
        error instanceof Error ? error.message : "注册请求失败，请重试"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1>欢迎使用 MyPet</h1>
        <ConnectButton.Custom>
          {({ account, chain, openConnectModal, mounted }) => {
            const ready = mounted
            const connected = ready && account && chain

            if (!connected) {
              return (
                <button
                  onClick={openConnectModal}
                  className={styles.connectButton}
                >
                  连接钱包
                </button>
              )
            }

            if (account?.address) {
              setWalletAddress(account.address)
            }

            return (
              <div className={styles.connectedInfo}>
                <span>{account?.displayName}</span>
              </div>
            )
          }}
        </ConnectButton.Custom>
        {isWalletConnected && !isRegistered && (
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="姓名"
              required
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="邮箱"
              required
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="电话"
              required
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="密码"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? "处理中..." : "注册"}
            </button>
            {errorMessage && (
              <div className={styles.errorAlert}>{errorMessage}</div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default observer(Login)
