// 从合约接口导入的类型定义
export enum InstitutionType {
  Hospital = 0,
  Shelter = 1,
}

export enum UserType {
  Personal = 0,
  Institutional = 1,
}

export enum RoleType {
  Admin = 0,
  User = 1,
  Hospital = 2,
  Shelter = 3,
}

export enum PetHealthStatus {
  Healthy = 0,
  Sick = 1,
  Recovering = 2,
  Critical = 3,
}

export enum PetAdoptionStatus {
  Available = 0,
  Adopted = 1,
  Processing = 2,
  NotAvailable = 3,
}

// 用户信息接口
export interface UserInfo {
  name: string
  email: string
  phone: string
  wallet: string
  userType: UserType
  orgId: number
  isProfileSet: boolean
  roleId: RoleType
  petIds: number[]
  registeredAt: number
  avatar: string
}

// 宠物信息接口
export interface Pet {
  id: number
  name: string
  species: string
  breed: string
  gender: string
  age: number
  description: string
  images: string[] // 修改为图片/视频URL数组
  image?: string // 保留向后兼容性
  healthStatus: PetHealthStatus
  adoptionStatus: PetAdoptionStatus
  owner: string
  medicalRecordIds: number[]
  lastUpdatedAt: number
}

// 机构信息接口
export interface Institution {
  id: number
  name: string
  institutionType: InstitutionType
  responsiblePerson: string
  staffList: string[]
  createdAt: number
  orgAddress: string
  contactInfo: string
}

// 医疗事件接口
export interface MedicalEvent {
  id: number
  petId: number
  diagnosis: string
  treatment: string
  timestamp: number
  hospital: number
  doctor: string
  cost: number
  attachments: string[]
}

// 救助请求接口
export interface RescueRequest {
  id: number
  location: string
  description: string
  status: string
  responderOrgId: number
  timestamp: number
  requester: string
  images: string[]
  urgencyLevel: number
}

// 领养事件接口
export interface AdoptionEvent {
  id: number
  petId: number
  adopter: string
  timestamp: number
  notes: string
  previousOwner: string
  institutionId: number
}

export {}
