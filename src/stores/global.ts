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
    // 页面加载时尝试从localStorage恢复钱包地址
    if (typeof window !== 'undefined') {
      const savedAddress = localStorage.getItem('walletAddress')
      if (savedAddress) {
        this.walletAddress = savedAddress as `0x${string}`
      }
    }
  }

  setLoading = (loading: boolean) => {
    runInAction(() => {
      this.isLoading = loading
    })
  }

  initContract = async (signer: ethers.Signer) => {
    try {
      // 如果合约已经初始化，则不需要重新初始化
      if (this.contract) {
        console.log("合约已初始化，无需重新初始化")
        return true
      }

      const contractAddress = "0x4B6ab6AE58f93C98DBa03084b57b278250C3e665" // 替换为您部署的合约地址
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

      console.log("合约初始化成功")
      return true
    } catch (error) {
      console.error("初始化合约失败:", error)
      return false
    }
  }
  setWalletAddress = (address: `0x${string}`) => {
    runInAction(() => {
      this.walletAddress = address
      // 将钱包地址保存到localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('walletAddress', address)
      }
    })
  }

  setUserProfile = async (
    name: string,
    email: string,
    phone: string,
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
      const tx = await this.contract.setUserProfile(
        name,
        email,
        phone,
        userTypeEnum,
        orgIdBN
      )
      await tx.wait()
      this.isRegistered = true
      await this.getUserInfo() // 更新用户信息
      return true
    } catch (error: any) {
      console.error("设置用户资料失败:", error)
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
      console.warn("合约未初始化，无法检查地址注册状态")
      return false
    }
    if (!this.walletAddress) {
      console.warn("钱包地址未设置，无法检查地址注册状态")
      return false
    }
    try {
      console.log("检查用户注册状态 - 开始", { address: this.walletAddress })
      const isRegistered = await this.contract.checkUserIsRegistered(
        this.walletAddress
      )
      console.log("检查用户注册状态 - 结果:", isRegistered)
      
      // 更新全局状态中的isRegistered值
      runInAction(() => {
        this.isRegistered = isRegistered
      })
      
      return isRegistered
    } catch (error) {
      console.error("检查地址注册状态失败:", error)
      return false
    }
  }

  // 获取所有机构信息
  getAllInstitutions = async () => {
    if (!this.contract) {
      console.warn("合约未初始化，无法获取机构列表")
      return [[], [], [], []]
    }
    try {
      const institutions = await this.contract.getAllInstitutions()
      return institutions
    } catch (error) {
      console.error("获取机构列表失败:", error)
      return [[], [], [], []]
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

  // 获取用户的宠物列表
  getUserPets = async () => {
    if (!this.contract) {
      console.warn("合约未初始化，无法获取宠物列表")
      return []
    }
    try {
      const pets = await this.contract.getUserPets(this.walletAddress)
      return pets
    } catch (error) {
      console.error("获取宠物列表失败:", error)
      return []
    }
  }

  // 添加宠物
  addPet = async (
    name: string,
    species: string,
    breed: string,
    gender: string,
    age: number,
    description: string,
    imageUrl: string
  ) => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.contract.registerPet(
        name,
        species,
        breed,
        gender,
        age,
        description,
        imageUrl
      )
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("添加宠物失败:", error)
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

  // 修改宠物信息
  updatePet = async (
    petId: number,
    name: string,
    species: string,
    breed: string,
    gender: string,
    age: number,
    description: string,
    imageUrl: string
  ) => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.contract.updatePet(
        petId,
        name,
        species,
        breed,
        gender,
        age,
        description,
        imageUrl
      )
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("修改宠物信息失败:", error)
      throw error
    }
  }

  // 解除与宠物的关系
  removePet = async (petId: number) => {
    if (!this.contract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.contract.removePet(petId)
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("解除宠物关系失败:", error)
      throw error
    }
  }

  //获取用户信息
  getUserInfo = async () => {
    if (!this.contract) {
      console.warn("合约未初始化，无法获取用户信息")
      return null
    }
    try {
      console.log("获取用户信息 - 开始", { address: this.walletAddress })
      const isRegistered = await this.checkRegisteredAddress()
      console.log("获取用户信息 - 用户注册状态:", isRegistered)
      
      if (!isRegistered) {
        console.warn("用户不存在，无法获取用户信息")
        return null
      }
      
      // 直接获取用户信息
      const userInfo = await this.contract.getUserInfo(this.walletAddress)
      console.log("获取用户信息 - 成功获取用户数据")
      
      runInAction(() => {
        this.userInfo = userInfo;
        this.isRegistered = true; // 确保isRegistered状态与获取到的用户信息一致
      })
      
      return userInfo
    } catch (error) {
      console.error("获取用户信息失败:", error)
      return null
    }
  }
}

const globalStore = new GlobalStore()
const globalContext = createContext(globalStore)
const useGlobalStore = (): GlobalStore => useContext(globalContext)

export { useGlobalStore }
export { globalStore }
