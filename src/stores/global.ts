import { useContext, createContext } from "react"
import { makeAutoObservable, runInAction } from "mobx"
import { ethers } from "ethers"
import MyPetContractABI from "../main.json"
class GlobalStore {
  contract: ethers.Contract | null = null
  userInfo: any = null
  isRegistered: boolean = false
  walletAddress: `0x${string}` = "0x0000000000000000000000000000000000000000"
  isLoading: boolean = false
  isContractDeployer: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setLoading = (loading: boolean) => {
    runInAction(() => {
      this.isLoading = loading
    })
  }

  initContract = async (signer: ethers.Signer) => {
    try {
      const contractAddress = "0x870f7de6cC6263628D08BC3141F64010BEde069a" // 替换为您部署的合约地址
      runInAction(() => {
        this.contract = new ethers.Contract(
          contractAddress,
          MyPetContractABI,
          signer
        )
      })

      // 检查当前用户是否为合约创建者
      const deployer = await this.contract!.deployer()
      this.isContractDeployer =
        deployer.toLowerCase() === this.walletAddress.toLowerCase()

      return true
    } catch (error) {
      console.error("初始化合约失败:", error)
      return false
    }
  }
  setWalletAddress = (address: `0x${string}`) => {
    runInAction(() => {
      this.walletAddress = address
    })
  }

  registerUser = async (
    name: string,
    email: string,
    phone: string,
    password: string,
    userType: "Personal" | "Institutional",
    orgId: number
  ) => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      // 确保参数类型正确
      const userTypeEnum = userType === "Personal" ? 0 : 1
      const orgIdBN = ethers.getBigInt(orgId)

      // 调用合约方法

      // 发送交易
      const tx = await this.contract.registerUser(
        name,
        email,
        phone,
        password,
        userTypeEnum,
        orgIdBN
      )
      await tx.wait()
      this.isRegistered = true
      return true
    } catch (error: any) {
      console.error("注册用户失败:", error)
      if (error.code === "INSUFFICIENT_FUNDS") {
        throw new Error("钱包中的ETH余额不足以支付gas费用")
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        throw new Error("无法估算gas限制，请检查合约地址是否正确")
      } else if (error.code === -32603) {
        throw new Error("交易执行失败，请确保您的钱包中有足够的ETH支付gas费用")
      }
      throw error
    }
  }

  setIsRegistered = (isRegistered: boolean) => {
    runInAction(() => {
      this.isRegistered = isRegistered
    })
  }

  checkRegisteredAddress = async () => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    if (!this.walletAddress) {
      throw new Error("钱包地址未设置")
    }
    try {
      const isRegistered = await this.contract.checkUserIsRegistered(
        this.walletAddress
      )
      return isRegistered
    } catch (error) {
      console.error("检查地址注册状态失败:", error)
      throw error
    }
  }

  // 获取所有机构信息
  getAllInstitutions = async () => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      const institutions = await this.contract.getAllInstitutions()
      return institutions
    } catch (error) {
      console.error("获取机构列表失败:", error)
      throw error
    }
  }

  // 添加机构
  addInstitution = async (
    name: string,
    institutionType: number,
    responsiblePerson: string
  ) => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    if (!this.isContractDeployer) {
      throw new Error("只有合约创建者才能添加机构")
    }
    try {
      this.setLoading(true)
      const tx = await this.contract.addInstitution(
        name,
        institutionType,
        responsiblePerson
      )
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("添加机构失败:", error)
      if (error.code === "INSUFFICIENT_FUNDS") {
        throw new Error("钱包中的ETH余额不足以支付gas费用")
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        throw new Error("无法估算gas限制，请检查合约地址是否正确")
      } else if (error.code === -32603) {
        throw new Error("交易执行失败，请确保您的钱包中有足够的ETH支付gas费用")
      }
      throw error
    }
  }

  //获取用户信息
  getUserInfo = async () => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      const isRegistered = await this.checkRegisteredAddress()
      if (!isRegistered) {
        throw new Error("用户不存在")
      }
      // 直接获取用户信息
      const userInfo = await this.contract.getUserInfo(this.walletAddress)
      runInAction(() => {
        this.userInfo = userInfo
      })
    } catch (error) {
      console.error("获取用户信息失败:", error)
      throw error
    }
  }
}

const globalStore = new GlobalStore()
const globalContext = createContext(globalStore)
const useGlobalStore = (): GlobalStore => useContext(globalContext)

export { useGlobalStore }
export { globalStore }
