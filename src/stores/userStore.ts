import { action, makeAutoObservable } from "mobx"
import { ethers } from "ethers"
import MyPetContract from "../../main.json"
import { useState, useEffect } from "react"
import { createContainer } from "unstated-next"

interface UserInfo {
  id: number
  name: string
  email: string
  phone: string
  wallet: string
  userType: "Personal" | "Institutional"
  orgId: number
}

class Store {
  isWalletConnected: boolean = false
  isRegistered: boolean = false
  userInfo: UserInfo | null = null
  walletAddress: string = ""
  contract: ethers.Contract | null = null
  isLoading: boolean = false

  constructor() {
    makeAutoObservable(this, {
      setWalletAddress: action,
      setWalletConnected: action,
      setUserInfo: action,
      setIsRegistered: action,
      setContract: action,
      clearWallet: action,
      checkRegistrationStatus: action,
      registerUser: action,
    })
  }

  loadFromStorage() {
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem("walletAddress")
      const savedIsRegistered = localStorage.getItem("isRegistered")
      const savedUserInfo = localStorage.getItem("userInfo")

      if (savedAddress) {
        this.walletAddress = savedAddress
        this.isWalletConnected = true
      }
      if (savedIsRegistered) {
        this.isRegistered = savedIsRegistered === "true"
      }
      if (savedUserInfo) {
        this.userInfo = JSON.parse(savedUserInfo)
      }
    }
  }

  setWalletAddress(address: string) {
    this.walletAddress = address
    if (typeof window !== "undefined") {
      localStorage.setItem("walletAddress", address)
    }
    if (address) {
      this.setWalletConnected(true)
      this.checkRegistrationStatus(address)
    }
  }

  clearWallet() {
    this.walletAddress = ""
    this.isWalletConnected = false
    this.isRegistered = false
    this.userInfo = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("walletAddress")
      localStorage.removeItem("isRegistered")
      localStorage.removeItem("userInfo")
    }
    window.location.href = "/login"
  }

  setWalletConnected(status: boolean) {
    this.isWalletConnected = status
    if (!status) {
      this.clearWallet()
    }
  }

  setUserInfo(info: UserInfo) {
    this.userInfo = info
    if (typeof window !== "undefined") {
      localStorage.setItem("userInfo", JSON.stringify(info))
    }
  }

  setIsRegistered(status: boolean) {
    this.isRegistered = status
    if (typeof window !== "undefined") {
      localStorage.setItem("isRegistered", String(status))
    }
  }

  setContract(contract: ethers.Contract) {
    this.contract = contract
  }

  async checkRegistrationStatus(address: string) {
    if (this.contract) {
      try {
        const [isRegistered, userId] = await Promise.all([
          this.contract._isUserRegistered(address),
          this.contract.userIds(address),
        ])
        this.setIsRegistered(isRegistered)
        if (isRegistered) {
          const userData = await this.contract.users(userId)
          this.setUserInfo({
            id: userId,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            wallet: address,
            userType: userData.userType === 0 ? "Personal" : "Institutional",
            orgId: userData.orgId,
          })
        }
        return isRegistered
      } catch (error) {
        console.error("检查注册状态失败:", error)
        return false
      }
    }
    return false
  }

  async registerUser(
    name: string,
    email: string,
    phone: string,
    password: string
  ) {
    if (this.contract && this.walletAddress) {
      try {
        const tx = await this.contract.registerUser(
          name,
          email,
          phone,
          password,
          0, // Personal user type
          0 // No organization ID for personal users
        )
        await tx.wait()
        const registeredUser = await this.contract.users(
          await this.contract.userIds(this.walletAddress)
        )
        this.setUserInfo({
          id: registeredUser.id.toNumber(),
          name: registeredUser.name,
          email: registeredUser.email,
          phone: registeredUser.phone,
          wallet: this.walletAddress,
          userType:
            registeredUser.userType === 0 ? "Personal" : "Institutional",
          orgId: registeredUser.orgId.toNumber(),
        })
        this.setIsRegistered(true)
        return true
      } catch (error) {
        console.error("用户注册失败:", error)
        return false
      }
    }
    return false
  }
}

function useStore() {
  const store = useState(() => new Store())[0]

  useEffect(() => {
    store.loadFromStorage()
  }, [])

  return store
}

export const userStore = createContainer(useStore)
