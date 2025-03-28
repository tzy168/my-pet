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
    uint _orgId
  ) external;

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
      RoleType roleId
    );
}
