// import { action, makeAutoObservable, runInAction } from "mobx"
// import { ethers } from "ethers"
// import MyPetContract from "../main.json"
// import { useState } from "react"
// import { createContainer } from "unstated-next"

// class Store {
//   userInfo: any = null
//   isRegistered: boolean = false
//   walletAddress: string = ""
//   contract: ethers.Contract | null = null

//   constructor() {
//     makeAutoObservable(this)
//   }

//   initContract = async (signer: ethers.Signer) => {
//     try {
//       const contractAddress = "0xea8A3FF06934f42d301FA733c44d30313Be724E5" // 替换为您部署的合约地址
//       runInAction(() => {
//         this.contract = new ethers.Contract(
//           contractAddress,
//           MyPetContract,
//           signer
//         )
//       })

//       return true
//     } catch (error) {
//       console.error("初始化合约失败:", error)
//       return false
//     }
//   }

//   setWalletAddress = (address: string) => {
//     runInAction(() => {
//       this.walletAddress = address
//     })
//   }

//   registerUser = async (
//     name: string,
//     email: string,
//     phone: string,
//     password: string,
//     userType: "Personal" | "Institutional",
//     orgId: number
//   ) => {
//     if (!this.contract) {
//       throw new Error("合约未初始化")
//     }
//     try {
//       const tx = await this.contract.registerUser(
//         name,
//         email,
//         phone,
//         password,
//         userType === "Personal" ? 0 : 1, // Convert string type to enum value
//         orgId
//       )
//       await tx.wait()
//       this.isRegistered = true
//       return true
//     } catch (error) {
//       console.error("注册用户失败:", error)
//       throw error
//     }
//   }

//   setIsRegistered = (isRegistered: boolean) => {
//     runInAction(() => {
//       this.isRegistered = isRegistered
//     })
//   }

//   checkRegisteredAddress = async (address: string) => {
//     if (!this.contract) {
//       throw new Error("合约未初始化")
//     }
//     try {
//       const isRegistered = await this.contract.checkUserIsRegistered(address)
//       return isRegistered
//     } catch (error) {
//       console.error("检查地址注册状态失败:", error)
//       throw error
//     }
//   }

//   // 获取所有机构信息
//   getAllInstitutions = async () => {
//     if (!this.contract) {
//       throw new Error("合约未初始化")
//     }
//     try {
//       const institutions = await this.contract.getAllInstitutions()
//       return institutions
//     } catch (error) {
//       console.error("获取机构列表失败:", error)
//       throw error
//     }
//   }
// }

// export const userStore = createContainer(() => useState(new Store())[0])
