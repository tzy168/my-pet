import { makeAutoObservable, runInAction } from "mobx"
import { ethers } from "ethers"
import { ContractConfig } from "../config/contracts"
import {
  Pet,
  PetHealthStatus,
  PetAdoptionStatus,
  UserInfo,
  Institution,
  AdoptionEvent,
  MedicalEvent,
  RescueRequest,
  UserType,
  RoleType,
  InstitutionType,
} from "./types"
import { createContext, useContext } from "react"

class GlobalStore {
  contract: ethers.Contract | null = null
  petContract: ethers.Contract | null = null
  userContract: ethers.Contract | null = null
  userInfo: UserInfo | null = null
  isRegistered: boolean = false
  walletAddress: string = "0x0000000000000000000000000000000000000000"
  isLoading: boolean = false
  isContractDeployer: boolean = false

  // 宠物相关状态
  pets: Pet[] = []
  medicalEvents: MedicalEvent[] = []
  adoptionEvents: AdoptionEvent[] = []
  rescueRequests: RescueRequest[] = []

  constructor() {
    makeAutoObservable(this)
    if (typeof window !== "undefined") {
      const savedAddress = localStorage.getItem("walletAddress")
      if (savedAddress) {
        this.walletAddress = savedAddress
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
      this.isContractDeployer =
        address && ContractConfig.contractDeployerAddress
          ? address.toLowerCase() ===
            ContractConfig.contractDeployerAddress.toLowerCase()
          : false

      if (typeof window !== "undefined") {
        localStorage.setItem("walletAddress", this.walletAddress)
      }
    })
  }

  // 用户相关方法
  setUserProfile = async (
    name: string,
    email: string,
    phone: string,
    userType: UserType,
    orgId: number,
    avatar: string = ""
  ) => {
    if (!this.userContract || !this.contract) {
      return { success: false, error: "合约未初始化" }
    }
    try {
      this.setLoading(true)
      // 验证机构用户的权限
      // if (userType === UserType.Institutional) {
      //   const isStaff = await this.contract.isStaffInInstitution(
      //     orgId,
      //     this.walletAddress
      //   )
      //   if (!isStaff) {
      //     return {
      //       success: false,
      //       error: "您不是该机构的员工，无法设置为机构用户",
      //     }
      //   }
      // }
      const tx = await this.userContract.setUserProfile(
        name,
        email,
        phone,
        userType,
        orgId,
        avatar
      )
      await tx.wait()
      await this.getUserInfo()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getUserInfo = async () => {
    if (!this.userContract) {
      return null
    }
    try {
      this.setLoading(true)
      const userInfo = await this.userContract.getUserInfo(this.walletAddress)
      runInAction(() => {
        this.userInfo = {
          name: userInfo.name,
          email: userInfo.email,
          phone: userInfo.phone,
          wallet: userInfo.wallet,
          userType: userInfo.userType,
          orgId: userInfo.orgId,
          isProfileSet: userInfo.isProfileSet,
          roleId: userInfo.roleId,
          petIds: userInfo.petIds,
          registeredAt: userInfo.registeredAt,
          avatar: userInfo.avatar,
        }
        this.isRegistered = true
      })
      return userInfo
    } catch (error) {
      console.error("获取用户信息失败:", error)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  // 机构相关方法
  // / "宠物医院A",
  // 0, // Hospital类型
  // addr1.address,
  // "北京市海淀区",
  // "010-12345678"
  addInstitution = async (
    name: string,
    institutionType: InstitutionType,
    responsiblePerson: string,
    address: string,
    contactInfo: string
  ) => {
    if (!this.contract) {
      return { success: false, error: "合约未初始化" }
    }
    try {
      this.setLoading(true)
      // 验证调用者是否为合约部署者
      if (!this.isContractDeployer) {
        return { success: false, error: "只有系统管理员可以添加机构" }
      }
      // 验证负责人地址是否已关联其他机构
      const staffInstitution =
        await this.contract.staffToInstitution(responsiblePerson)
      if (staffInstitution > 0) {
        return { success: false, error: "该地址已关联其他机构" }
      }
      const tx = await this.contract.addInstitution(
        name,
        institutionType,
        responsiblePerson,
        address,
        contactInfo
      )
      await tx.wait()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    } finally {
      this.setLoading(false)
    }
  }

  addStaffToInstitution = async (orgId: number, staff: string) => {
    if (!this.contract) {
      return { success: false, error: "合约未初始化" }
    }

    try {
      this.setLoading(true)
      const tx = await this.contract.addStaffToInstitution(orgId, staff)
      await tx.wait()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  removeStaffFromInstitution = async (orgId: number, staff: string) => {
    if (!this.contract) {
      return { success: false, error: "合约未初始化" }
    }

    try {
      this.setLoading(true)
      const tx = await this.contract.removeStaffFromInstitution(orgId, staff)
      await tx.wait()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getInstitutionDetail = async (orgId: number) => {
    if (!this.contract) {
      return null
    }
    try {
      this.setLoading(true)
      const institution = await this.contract.getInstitutionDetail(orgId)
      return institution
    } catch (error) {
      console.error("获取机构详情失败:", error)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  getAllInstitutions = async () => {
    if (!this.contract) {
      return []
    }
    try {
      this.setLoading(true)
      const institutions = await this.contract.getAllInstitutions()
      return institutions
    } catch (error) {
      console.error("获取所有机构失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  // 宠物相关方法
  addPet = async (
    name: string,
    species: string,
    breed: string,
    gender: string,
    age: number,
    description: string,
    image: string,
    healthStatus: PetHealthStatus,
    adoptionStatus: PetAdoptionStatus
  ) => {
    if (!this.petContract || !this.userContract) {
      return { success: false, error: "合约未初始化" }
    }

    try {
      this.setLoading(true)
      // 验证用户是否已注册
      const isRegistered = await this.userContract.checkUserIsRegistered(
        this.walletAddress
      )
      if (!isRegistered) {
        return { success: false, error: "请先完成用户注册" }
      }

      const tx = await this.petContract.addPet(
        name,
        species,
        breed,
        gender,
        age,
        description,
        image,
        healthStatus,
        adoptionStatus
      )
      await tx.wait()
      await this.getUserPets()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  updatePet = async (
    petId: number,
    name: string,
    species: string,
    breed: string,
    gender: string,
    age: number,
    description: string,
    image: string,
    healthStatus: PetHealthStatus,
    adoptionStatus: PetAdoptionStatus
  ) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
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
        image,
        healthStatus,
        adoptionStatus
      )
      await tx.wait()
      await this.getUserPets()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  updatePetHealthStatus = async (
    petId: number,
    healthStatus: PetHealthStatus
  ) => {
    if (!this.petContract || !this.contract) {
      return { success: false, error: "合约未初始化" }
    }

    try {
      this.setLoading(true)
      // 验证调用者是否为医院工作人员或宠物主人
      const institutionId = await this.contract.staffToInstitution(
        this.walletAddress
      )
      let isHospitalStaff = false
      if (institutionId !== 0) {
        const inst = await this.contract.getInstitutionDetail(institutionId)
        isHospitalStaff = inst.institutionType === InstitutionType.Hospital
      }

      const pet = await this.petContract.getPetById(petId)
      if (!isHospitalStaff && pet.owner !== this.walletAddress) {
        return {
          success: false,
          error: "只有宠物主人或医院工作人员可以更新健康状态",
        }
      }

      const tx = await this.petContract.updatePetHealthStatus(
        petId,
        healthStatus
      )
      await tx.wait()
      await this.getUserPets()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  updatePetAdoptionStatus = async (
    petId: number,
    adoptionStatus: PetAdoptionStatus
  ) => {
    if (!this.petContract || !this.contract) {
      return { success: false, error: "合约未初始化" }
    }

    try {
      this.setLoading(true)
      // 验证调用者是否为救助站工作人员或宠物主人
      const institutionId = await this.contract.staffToInstitution(
        this.walletAddress
      )
      let isShelterStaff = false
      if (institutionId !== 0) {
        const inst = await this.contract.getInstitutionDetail(institutionId)
        isShelterStaff = inst.institutionType === InstitutionType.Shelter
      }

      const pet = await this.petContract.getPetById(petId)
      if (!isShelterStaff && pet.owner !== this.walletAddress) {
        return {
          success: false,
          error: "只有宠物主人或救助站工作人员可以更新领养状态",
        }
      }

      const tx = await this.petContract.updatePetAdoptionStatus(
        petId,
        adoptionStatus
      )
      await tx.wait()
      await this.getUserPets()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  removePet = async (petId: number) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
    }

    try {
      this.setLoading(true)
      const tx = await this.petContract.removePet(petId)
      await tx.wait()
      await this.getUserPets()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getUserPets = async () => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const pets = await this.petContract.getUserPets(this.walletAddress)
      runInAction(() => {
        this.pets = pets
      })
      return pets
    } catch (error) {
      console.error("获取用户宠物失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  getAllPets = async () => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const pets = await this.petContract.getAllPets()
      return pets
    } catch (error) {
      console.error("获取所有宠物失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  getPetById = async (petId: number) => {
    if (!this.petContract) {
      return null
    }

    try {
      this.setLoading(true)
      const pet = await this.petContract.getPetById(petId)
      return pet
    } catch (error) {
      console.error("获取宠物信息失败:", error)
      return null
    } finally {
      this.setLoading(false)
    }
  }

  // 医疗事件相关方法
  addMedicalEvent = async (
    petId: number,
    diagnosis: string,
    treatment: string,
    cost: number,
    attachments: string[]
  ) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
    }
    try {
      this.setLoading(true)
      const tx = await this.petContract.addMedicalEvent(
        petId,
        diagnosis,
        treatment,
        cost,
        attachments
      )
      await tx.wait()
      await this.getPetMedicalHistory(petId)
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getPetMedicalHistory = async (petId: number) => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const events = await this.petContract.getPetMedicalHistory(petId)
      runInAction(() => {
        this.medicalEvents = events
      })
      return events
    } catch (error) {
      console.error("获取医疗记录失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  // 领养事件相关方法
  addAdoptionEvent = async (
    petId: number,
    adopter: string,
    notes: string,
    institutionId: number
  ) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
    }

    try {
      this.setLoading(true)
      const tx = await this.petContract.addAdoptionEvent(
        petId,
        adopter,
        notes,
        institutionId
      )
      await tx.wait()
      await this.getPetAdoptionHistory(petId)
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getPetAdoptionHistory = async (petId: number) => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const events = await this.petContract.getPetAdoptionHistory(petId)
      runInAction(() => {
        this.adoptionEvents = events
      })
      return events
    } catch (error) {
      console.error("获取领养历史失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  // 救助请求相关方法
  addRescueRequest = async (
    location: string,
    description: string,
    images: string[],
    urgencyLevel: number
  ) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
    }

    try {
      this.setLoading(true)
      const tx = await this.petContract.addRescueRequest(
        location,
        description,
        images,
        urgencyLevel
      )
      await tx.wait()
      await this.getUserRescueRequests()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  getUserRescueRequests = async () => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const requests = await this.petContract.getUserRescueRequests(
        this.walletAddress
      )
      runInAction(() => {
        this.rescueRequests = requests
      })
      return requests
    } catch (error) {
      console.error("获取救助请求失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  getAllRescueRequests = async () => {
    if (!this.petContract) {
      return []
    }

    try {
      this.setLoading(true)
      const requests = await this.petContract.getAllRescueRequests()
      return requests
    } catch (error) {
      console.error("获取所有救助请求失败:", error)
      return []
    } finally {
      this.setLoading(false)
    }
  }

  updateRescueRequestStatus = async (
    requestId: number,
    status: string,
    responderOrgId: number
  ) => {
    if (!this.petContract) {
      return { success: false, error: "宠物合约未初始化" }
    }
    try {
      this.setLoading(true)
      console.log("res")

      const tx = await this.petContract.updateRescueRequestStatus(
        requestId,
        status,
        responderOrgId
      )
      const res = await tx.wait()
      await this.getUserRescueRequests()
      return { success: true }
    } catch (error: any) {
      this.setLoading(false)
      return this.handleContractError(error)
    }
  }

  // 错误处理
  private handleContractError = (error: any) => {
    const errorMessage = error.message || ""
    const errorCode = error.code
    const dataError = error.data?.originalError?.code

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
        error: "用户拒绝了交易",
        userRejected: true,
      }
    }

    if (errorMessage.includes("wallet is not connected")) {
      return {
        success: false,
        error: "钱包未连接",
        walletNotConnected: true,
      }
    }

    if (errorMessage.includes("insufficient funds")) {
      return {
        success: false,
        error: "余额不足",
        insufficientFunds: true,
      }
    }

    return {
      success: false,
      error: "合约调用失败: " + errorMessage,
    }
  }
}

const globalStore = new GlobalStore()
const globalContext = createContext(globalStore)
const useGlobalStore = (): GlobalStore => useContext(globalContext)

export { useGlobalStore }
export { globalStore }
