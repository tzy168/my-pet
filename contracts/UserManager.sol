// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IUserManager.sol";

contract UserManager is IUserManager {
  // 用户存储
  mapping(address => uint) public userIds;
  User[] public users;
  uint256 public userIdCounter = 1;

  // 机构映射
  mapping(uint => Institution) public institutions;

  // InstitutionManager合约地址
  address public immutable institutionManagerAddress;
  
  // 合约部署者地址
  address public deployer;

  constructor(address _institutionManagerAddress) {
    require(
      _institutionManagerAddress != address(0),
      "Invalid institution manager address"
    );
    institutionManagerAddress = _institutionManagerAddress;
    deployer = msg.sender;
  }

  // 内部函数：检查用户是否已注册
  function _isUserRegistered(address _user) internal view returns (bool) {
    return userIds[_user] != 0;
  }

  // 设置用户资料
  function setUserProfile(
    string memory _name,
    string memory _email,
    string memory _phone,
    UserType _userType,
    uint _orgId
  ) external override {
    bool isNewUser = !_isUserRegistered(msg.sender);
    if (_userType == UserType.Institutional) {
      require(
        _orgId != 0,
        "Institutional user must associate with an institution"
      );
      require(_orgId < userIdCounter, "Associated institution does not exist");
    } else {
      require(
        _orgId == 0,
        "Personal user should not associate with an institution"
      );
    }

    // 确定用户角色
    RoleType roleId;
    
    // 检查是否是合约部署者
    if (msg.sender == tx.origin && block.coinbase != msg.sender) {
      // 如果是合约部署者，设置为管理员角色
      if (msg.sender == deployer) {
        roleId = RoleType.Admin;
      } else if (_userType == UserType.Institutional && _orgId > 0) {
        // 根据机构类型设置角色
        if (_orgId > 0) {
          // 获取机构类型
          InstitutionType instType = institutions[_orgId - 1].institutionType;
          if (instType == InstitutionType.Hospital) {
            roleId = RoleType.Hospital;
          } else if (instType == InstitutionType.Shelter) {
            roleId = RoleType.Shelter;
          } else {
            roleId = RoleType.User;
          }
        } else {
          roleId = RoleType.User;
        }
      } else {
        // 普通用户
        roleId = RoleType.User;
      }
    } else {
      // 默认为普通用户
      roleId = RoleType.User;
    }
    
    if (isNewUser) {
      userIds[msg.sender] = userIdCounter;
      users.push();
      uint index = users.length - 1;
      User storage newUser = users[index];
      newUser.id = userIdCounter;
      newUser.name = _name;
      newUser.email = _email;
      newUser.phone = _phone;
      newUser.wallet = msg.sender;
      newUser.userType = _userType;
      newUser.orgId = _orgId;
      newUser.isProfileSet = true;
      newUser.roleId = roleId; // 设置角色ID
      userIdCounter++;
    } else {
      uint userId = userIds[msg.sender];
      User storage user = users[userId - 1];
      user.name = _name;
      user.email = _email;
      user.phone = _phone;
      user.userType = _userType;
      user.orgId = _orgId;
      user.isProfileSet = true;
      user.roleId = roleId; // 更新角色ID
    }
  }

  // 检查用户是否已注册
  function checkUserIsRegistered(
    address _user
  ) external view override returns (bool) {
    return _isUserRegistered(_user);
  }

  // 获取用户信息
  function getUserInfo(
    address _user
  )
    external
    view
    override
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
    )
  {
    require(_isUserRegistered(_user), "User not registered");

    uint256 userId = userIds[_user];
    User storage user = users[userId - 1];

    id = user.id;
    name = user.name;
    email = user.email;
    phone = user.phone;
    wallet = user.wallet;
    userType = user.userType;
    orgId = user.orgId;
    roleId = user.roleId; // 返回用户角色ID

    if (userType == UserType.Institutional && orgId != 0) {
      Institution storage inst = institutions[orgId - 1];
      orgName = inst.name;
      orgType = inst.institutionType;
    } else {
      orgName = "";
      orgType = InstitutionType.Hospital;
    }
  }
}
