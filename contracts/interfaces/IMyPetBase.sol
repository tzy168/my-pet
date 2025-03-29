// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMyPetBase {
  // 定义机构类型：宠物医院 (Hospital) 和动物救助站 (Shelter)
  enum InstitutionType {
    Hospital,
    Shelter
  }

  // 定义用户类型：个人用户 (Personal) 和 机构用户 (Institutional)
  enum UserType {
    Personal,
    Institutional
  }

  // 定义用户角色：管理员、普通用户、医院人员、救助站人员
  enum RoleType {
    Admin, // 0: 合约部署者/管理员
    User, // 1: 普通用户
    Hospital, // 2: 医院机构人员
    Shelter // 3: 救助站机构人员
  }

  // 定义宠物健康状态
  enum PetHealthStatus {
    Healthy,
    Sick,
    Recovering,
    Critical
  }

  // 定义宠物领养状态
  enum PetAdoptionStatus {
    Available, // 可领养
    Adopted, // 已领养
    Processing, // 领养中
    NotAvailable // 不可领养
  }

  // 机构结构体
  struct Institution {
    uint id; // id
    string name; // 名称
    InstitutionType institutionType; // 机构类型
    address responsiblePerson; // 负责人地址
    address[] staffList; // 员工列表
    uint createdAt; // 创建时间
    string orgAddress; // 机构地址
    string contactInfo; // 联系信息
  }

  // 用户结构体
  struct User {
    string name; // 姓名 0
    string email; // 邮箱 1
    string phone; //电话 2
    address wallet; // 钱包地址 3
    UserType userType; // 用户类型 4
    uint orgId; // 关联机构ID 5
    bool isProfileSet; // 是否注册信息 6
    RoleType roleId; // 角色类型 7
    uint[] petIds; // 拥有的宠物ID列表 8
    uint registeredAt; // 注册时间 9
    string avatar; // 用户头像 10
  }

  // 宠物结构体
  struct Pet {
    uint id;
    string name;
    string species; // 物种
    string breed; // 品种
    string gender; // 性别
    uint age; // 年龄
    string description; // 描述
    string image; // 图片URL
    PetHealthStatus healthStatus; // 健康状态
    PetAdoptionStatus adoptionStatus; // 领养状态
    address owner; // 拥有者地址
    uint[] medicalRecordIds; // 医疗记录ID列表
    uint lastUpdatedAt; // 最后更新时间
  }

  // 领养事件结构体
  struct AdoptionEvent {
    uint id; // 事件ID
    uint petId; // 宠物ID
    address adopter; // 领养人地址
    uint timestamp; // 时间戳
    string notes; // 备注
    address previousOwner; // 前任主人
    uint institutionId; // 处理机构ID（如果通过救助站领养）
  }

  // 医疗事件结构体
  struct MedicalEvent {
    uint id; // 记录ID
    uint petId; // 宠物ID
    string diagnosis; // 诊断结果
    string treatment; // 治疗方案
    uint timestamp; // 创建时间
    uint hospital; // 创建人所属机构ID
    address doctor; // 创建人地址
    uint cost; // 医疗费用
    string[] attachments; // 附件（如检查报告图片URL）
  }

  // 救助请求结构体
  struct RescueRequest {
    uint id; // 请求ID
    string location; // 位置
    string description; // 描述
    string status; // 状态
    uint responderOrgId; // 响应机构ID
    uint timestamp; // 时间戳
    address requester; // 请求者地址
    string[] images; // 现场图片URL数组
    uint urgencyLevel; // 紧急程度 (1-5)
  }
}
