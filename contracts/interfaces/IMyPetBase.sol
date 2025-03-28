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

  // 机构结构体
  struct Institution {
    uint id;
    string name;
    InstitutionType institutionType;
    address wallet;
    address responsiblePerson;
    address[] staffList; // 添加员工列表字段
  }

  // 用户结构体
  struct User {
    uint id;
    string name;
    string email;
    string phone;
    address wallet;
    UserType userType;
    uint orgId;
    bool isProfileSet;
    RoleType roleId; // 添加角色ID字段
  }

  // 宠物结构体
  struct Pet {
    uint id;
    string name;
    string species;
    string breed;
    string gender;
    uint age;
    string description;
    string image;
    string status;
    address owner;
  }

  // 领养事件结构体
  struct AdoptionEvent {
    uint petId;
    address adopter;
    uint timestamp;
    string notes;
  }

  // 医疗事件结构体
  struct MedicalEvent {
    uint petId;
    string diagnosis;
    string treatment;
    uint timestamp;
    uint hospital;
    address doctor;
  }

  // 救助请求结构体
  struct RescueRequest {
    uint id;
    string location;
    string description;
    string status;
    uint responderOrgId;
    uint timestamp;
  }
}
