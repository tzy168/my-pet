import { action, makeAutoObservable, runInAction } from "mobx"
import { ethers } from "ethers"
import { useState, useEffect, useRef } from "react"
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
  contract: any
  isLoading: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setWalletConnected = (connected: boolean) => {
    this.isWalletConnected = connected
  }

  setWalletAddress = (address: string) => {
    runInAction(() => {
      this.isWalletConnected = true
      this.walletAddress = address
    })
  }

  setIsRegistered = (registered: boolean) => {
    this.isRegistered = registered
  }
}
export const userStore = createContainer(() => useState(new Store())[0])
