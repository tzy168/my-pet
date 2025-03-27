import { useContext, createContext } from "react"
import { makeAutoObservable, runInAction } from "mobx"
import { ethers } from "ethers"
import { ContractConfig } from "../config/contracts"
class GlobalStore {
  contract: ethers.Contract | null = null
  petContract: ethers.Contract | null = null
  userContract: ethers.Contract | null = null
  userInfo: any = null
  isRegistered: boolean = false
  walletAddress: string = "0x0000000000000000000000000000000000000000"
  isLoading: boolean = false
  isContractDeployer: boolean =
    "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" === this.walletAddress
  constructor() {
    makeAutoObservable(this)
    // 页面加载时尝试从localStorage恢复钱包地址
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem("walletAddress")
      if (savedAddress) {
        this.walletAddress = savedAddress as string
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
      this.setLoading(true)
      // 如果合约已经初始化，则不需要重新初始化
      if (this.contract && this.petContract && this.userContract) {
        console.log("合约已初始化，无需重新初始化")
        this.setLoading(false)
        return true
      }

      // 设置较高的gas限制和优先级，加快交易处理速度
      const options = {
        gasLimit: 3000000,
        gasPrice: ethers.parseUnits("50", "gwei"),
      }

      runInAction(() => {
        this.contract = new ethers.Contract(
          ContractConfig.InstitutionManager.address,
          ContractConfig.InstitutionManager.abi,
          signer
        )
        this.petContract = new ethers.Contract(
          ContractConfig.PetManager.address,
          ContractConfig.PetManager.abi,
          signer
        )
        this.userContract = new ethers.Contract(
          ContractConfig.UserManager.address,
          ContractConfig.UserManager.abi,
          signer
        )
      })

      console.log("合约初始化成功")
      this.setLoading(false)
      return true
    } catch (error) {
      this.setLoading(false)
      console.error("初始化合约失败:", error)
      return false
    }
  }
  setWalletAddress = (address: string) => {
    runInAction(() => {
      this.walletAddress =
        address || "0x0000000000000000000000000000000000000000"
      // 更新isContractDeployer状态
      this.isContractDeployer =
        address && ContractConfig.contractDeployerAddress
          ? address.toLowerCase() ===
            ContractConfig.contractDeployerAddress.toLowerCase()
          : false
      // 将钱包地址保存到localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "walletAddress",
          address || "0x0000000000000000000000000000000000000000"
        )
      }
    })
  }

  setUserProfile = async (
    name: string,
    email: string,
    phone: string,
    userType: string,
    orgId: number
  ) => {
    try {
      if (!this.userContract || !this.contract) {
        return { success: false, error: "合约未初始化" }
      }

      this.setLoading(true)

      // 转换用户类型
      const userTypeEnum = userType === "Personal" ? 0 : 1

      // 调用合约方法设置用户资料
      const tx = await this.userContract.setUserProfile(
        name,
        email,
        phone,
        userTypeEnum,
        orgId
      )

      console.log("交易已提交，等待确认...")
      await tx.wait()
      console.log("交易已确认")

      // 如果是机构用户，自动将用户添加为该机构的员工
      if (userTypeEnum === 1 && orgId > 0) {
        try {
          // 检查用户是否已经是该机构的员工
          const currentInstitution = await this.contract.staffToInstitution(
            this.walletAddress
          )
          const isZeroAddress =
            currentInstitution === "0x0000000000000000000000000000000000000000"

          if (isZeroAddress) {
            console.log("将用户添加为机构员工:", orgId)
            // 获取机构负责人地址
            const institutionDetails =
              await this.contract.getInstitutionDetail(orgId)
            const responsiblePerson = institutionDetails.responsiblePerson

            // 如果当前用户是机构负责人，则自动将自己添加为员工
            if (
              this.walletAddress.toLowerCase() ===
              responsiblePerson.toLowerCase()
            ) {
              const staffTx = await this.contract.addStaffToInstitution(
                orgId,
                this.walletAddress
              )
              await staffTx.wait()
              console.log("已添加为机构员工")
            }
          }
        } catch (error) {
          console.error("添加机构员工失败:", error)
          // 这里不返回错误，因为添加员工失败不应该阻止用户资料设置完成
        }
      }

      // 重新获取用户信息
      await this.getUserInfo()

      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      console.error("设置用户资料失败:", error)

      // 添加详细错误日志
      console.log(
        "完整错误对象:",
        JSON.stringify(error, Object.getOwnPropertyNames(error))
      )

      // 检查更详细的错误类型
      const errorMessage = error.message || ""
      const errorCode = error.code
      const dataError = error.data?.originalError?.code

      // 扩展错误类型检测
      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("not been authorized") ||
        errorMessage.includes("User denied") ||
        errorMessage.includes("authorized by the user") ||
        errorCode === 4001 ||
        errorCode === 4100 ||
        dataError === 4001 ||
        dataError === 4100
      ) {
        return {
          success: false,
          error:
            "请完成以下操作：\n1. 点击MetaMask浏览器插件图标\n2. 检查待处理交易\n3. 确认授权请求\n4. 刷新页面后重试",
          userRejected: true,
        }
      }

      // 处理钱包未连接状态
      if (errorMessage.includes("wallet is not connected")) {
        return {
          success: false,
          error: "钱包未连接，请先连接MetaMask钱包",
          walletNotConnected: true,
        }
      }

      // 余额不足错误
      if (errorMessage.includes("insufficient funds")) {
        return {
          success: false,
          error: "账户余额不足，无法支付交易费用",
          insufficientFunds: true,
        }
      }

      // 一般错误
      return {
        success: false,
        error: `操作失败: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? "..." : ""}`,
      }
    } finally {
      this.setLoading(false)
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
      this.setLoading(true)
      console.log("检查用户注册状态 - 开始", { address: this.walletAddress })
      const isRegistered = await this.userContract?.checkUserIsRegistered(
        this.walletAddress
      )
      console.log("检查用户注册状态 - 结果:", isRegistered)

      // 更新全局状态中的isRegistered值
      runInAction(() => {
        this.isRegistered = isRegistered
      })

      this.setLoading(false)
      return isRegistered
    } catch (error) {
      this.setLoading(false)
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
      throw new Error("只有合约部署者可以添加机构")
    }
    try {
      this.setLoading(true)
      // 验证参数
      if (!name || !responsiblePerson) {
        throw new Error("机构名称和负责人地址不能为空")
      }
      if (!ethers.isAddress(responsiblePerson)) {
        throw new Error("无效的负责人钱包地址")
      }

      // 确保名称是有效的字符串，处理可能的中文编码问题
      const encodedName = name.trim()

      // 使用更高的gas限制，确保复杂操作能够完成
      const tx = await this.contract.addInstitution(
        encodedName,
        institutionType,
        responsiblePerson
      )

      // 等待交易确认
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)

      // 详细的错误处理
      if (error.code === "INSUFFICIENT_FUNDS") {
        throw new Error("钱包中的ETH余额不足以支付gas费用")
      } else if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        throw new Error(
          "无法估算gas限制，请检查合约地址是否正确或参数格式是否有误"
        )
      } else if (error.code === -32603) {
        throw new Error("交易执行失败，请确保您的钱包中有足够的ETH支付gas费用")
      } else if (error.reason) {
        throw new Error(`合约执行错误: ${error.reason}`)
      } else if (
        error.message &&
        error.message.includes("missing revert data")
      ) {
        throw new Error(
          "合约调用失败，可能是中文字符编码问题或参数格式错误，请尝试简化机构名称或检查参数格式"
        )
      }

      // 如果是其他未知错误，返回原始错误
      throw error
    }
  }

  // 获取用户的宠物列表
  getUserPets = async () => {
    if (!this.petContract) {
      console.warn("合约未初始化，无法获取宠物列表")
      return []
    }
    try {
      const pets = await this.petContract.getUserPets(this.walletAddress)
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
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.addPet(
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
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.updatePet(
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
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.removePet(petId)
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
    if (!this.userContract) {
      console.warn("用户合约未初始化，无法获取用户信息")
      return null
    }
    try {
      this.setLoading(true)
      console.log("获取用户信息 - 开始", { address: this.walletAddress })
      const isRegistered = await this.checkRegisteredAddress()
      console.log("获取用户信息 - 用户注册状态:", isRegistered)

      if (!isRegistered) {
        console.warn("用户不存在，无法获取用户信息")
        this.setLoading(false)
        return null
      }

      // 直接获取用户信息
      const userInfo = await this.userContract.getUserInfo(this.walletAddress)
      console.log("获取用户信息 - 成功获取用户数据")

      runInAction(() => {
        this.userInfo = userInfo
        this.isRegistered = true // 确保isRegistered状态与获取到的用户信息一致
      })

      this.setLoading(false)
      return userInfo
    } catch (error) {
      this.setLoading(false)
      console.error("获取用户信息失败:", error)
      return null
    }
  }

  resetUserState = () => {
    runInAction(() => {
      this.contract = null
      this.petContract = null
      this.userContract = null
      this.userInfo = null
      this.isRegistered = false
      this.walletAddress = "0x0000000000000000000000000000000000000000"
      this.isContractDeployer = false
      // 清除localStorage中保存的钱包地址
      if (typeof window !== "undefined") {
        localStorage.removeItem("walletAddress")
      }
    })
  }

  // 添加医疗记录
  addMedicalEvent = async (
    petId: number,
    diagnosis: string,
    treatment: string
  ) => {
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }

    try {
      this.setLoading(true)

      // 简化调用，不传递额外的选项
      const tx = await this.petContract.addMedicalEvent(
        petId,
        diagnosis,
        treatment
      )

      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("添加医疗记录失败:", error)
      throw error
    }
  }

  // 添加救助请求
  addRescueRequest = async (location: string, description: string) => {
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.addRescueRequest(location, description)
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("添加救助请求失败:", error)
      throw error
    }
  }

  // 更新救助请求状态
  updateRescueRequestStatus = async (
    requestId: number,
    status: string,
    responderOrgId: number
  ) => {
    if (!this.petContract) {
      throw new Error("合约未初始化")
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.updateRescueRequestStatus(
        requestId,
        status,
        responderOrgId
      )
      await tx.wait()
      this.setLoading(false)
      return true
    } catch (error: any) {
      this.setLoading(false)
      console.error("更新救助请求状态失败:", error)
      throw error
    }
  }

  getInstitutionManagerContract = () => {
    if (!this.contract) {
      console.warn("机构管理合约未初始化")
      return null
    }
    return this.contract
  }

  setUserInfo = (userInfo: any) => {
    runInAction(() => {
      this.userInfo = userInfo
    })
  }

  // 获取所有系统中的宠物
  getAllPets = async () => {
    try {
      if (!this.petContract) {
        throw new Error("Pet contract not initialized")
      }

      this.setLoading(true)

      // 获取宠物总数
      const petCount = await this.petContract.getPetCount()
      console.log("系统中宠物总数:", petCount)

      const pets = []

      // 获取每个宠物的详细信息
      for (let i = 1; i <= petCount; i++) {
        try {
          const pet = await this.petContract.pets(i)
          pets.push({
            id: i,
            name: pet.name,
            species: pet.species,
            breed: pet.breed,
            gender: pet.gender,
            age: Number(pet.age),
            description: pet.description,
            image: pet.image,
            owner: pet.owner,
          })
        } catch (error) {
          console.error(`获取宠物ID ${i} 详情失败:`, error)
        }
      }

      this.setLoading(false)
      return pets
    } catch (error) {
      this.setLoading(false)
      console.error("获取所有宠物失败:", error)
      throw error
    }
  }

  // 检查用户是否是医院员工
  checkIsHospitalStaff = async () => {
    try {
      if (!this.contract || !this.walletAddress) {
        return { isStaff: false, message: "未连接钱包或合约未初始化" }
      }

      // 获取用户所属机构地址
      const institutionAddress = await this.contract.staffToInstitution(
        this.walletAddress
      )

      // 检查是否有关联机构
      if (institutionAddress === "0x0000000000000000000000000000000000000000") {
        return { isStaff: false, message: "您不是任何机构的员工" }
      }

      // 获取机构ID
      const institutionId =
        await this.contract.institutionAddressToId(institutionAddress)

      // 获取机构详情
      const institutionDetails =
        await this.contract.getInstitutionDetail(institutionId)

      // 检查机构类型是否为医院 (0 = 医院)
      const isHospital = Number(institutionDetails[2]) === 0

      return {
        isStaff: isHospital,
        message: isHospital ? "您是医院员工" : "您所属的机构不是医院",
        institutionId: Number(institutionId),
        institutionName: institutionDetails[1],
        institutionAddress: institutionAddress,
      }
    } catch (error) {
      console.error("检查医院员工状态失败:", error)
      return { isStaff: false, message: "检查权限时出错" }
    }
  }
}

const globalStore = new GlobalStore()
const globalContext = createContext(globalStore)
const useGlobalStore = (): GlobalStore => useContext(globalContext)

export { useGlobalStore }
export { globalStore }
