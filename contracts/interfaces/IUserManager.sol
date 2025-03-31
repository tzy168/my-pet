// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMyPetBase.sol";

interface IUserManager is IMyPetBase {
  // 设置用户资料
  function setUserProfile(
    string memory _name,
    string memory _email,
    string memory _phone,
    UserType _userType,
    uint _orgId,
    string memory _avatar
  ) external;

  // 更新用户角色
  function updateUserRole(address _user, RoleType _roleId) external;

  // 添加宠物到用户
  function addPetToUser(address _user, uint _petId) external;

  // 从用户移除宠物
  function removePetFromUser(address _user, uint _petId) external;

  // 获取用户拥有的宠物ID列表
  function getUserPetIds(address _user) external view returns (uint[] memory);

  // 检查用户是否已注册
  function checkUserIsRegistered(address _user) external view returns (bool);

  // 获取用户信息
  function getUserInfo(
    address _user
  )
    external
    view
    returns (
      uint256 id,
      string memory name,
      string memory email,
      string memory phone,
      address wallet,
      UserType userType,
      uint256 orgId,
      string memory orgName,
      InstitutionType orgType,
      RoleType roleId,
      string memory avatar
    );

  // 获取所有用户
  function getAllUsers() external view returns (User[] memory);

  // 获取特定角色的用户
  function getUsersByRole(
    RoleType _roleId
  ) external view returns (User[] memory);

  // 获取特定机构的用户
  function getUsersByInstitution(
    uint _orgId
  ) external view returns (User[] memory);
}
