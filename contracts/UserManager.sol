// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IUserManager.sol";
import "./interfaces/IInstitutionManager.sol";

/**
 * @title UserManager
 * @dev 用户管理合约，负责用户注册、资料管理、角色分配和宠物所有权记录
 */
contract UserManager is IUserManager {
  // 事件定义
  event UserProfileSet(
    address indexed user,
    string name,
    UserType userType,
    uint orgId,
    uint timestamp
  );
  event UserRoleUpdated(
    address indexed user,
    RoleType oldRole,
    RoleType newRole,
    uint timestamp
  );
  event PetAddedToUser(address indexed user, uint petId, uint timestamp);
  event PetRemovedFromUser(address indexed user, uint petId, uint timestamp);
  // 用户存储
  mapping(address => uint) public userIds;
  User[] public users;
  mapping(address => User[]) public userAddress;
  uint256 public userIdCounter = 1;

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
    string memory _name, // 姓名
    string memory _email, // 邮箱
    string memory _phone, //  电话
    UserType _userType, // 用户类型
    uint _orgId, // 机构ID
    string memory _avatar // 头像URL
  ) external override {
    bool isNewUser = !_isUserRegistered(msg.sender);
    if (_userType == UserType.Institutional) {
      // 验证机构ID是否有效
      require(
        _orgId != 0,
        "Institutional user must associate with an institution"
      );
      IInstitutionManager institutionManager = IInstitutionManager(
        institutionManagerAddress
      );
      // 验证机构是否存在
      require(
        _orgId < institutionManager.institutionIdCounter(),
        "Associated institution does not exist"
      );
    } else {
      // 个人用户不允许关联机构
      require(
        _orgId == 0,
        "Personal user should not associate with an institution"
      );
    }
    // 确定用户角色
    RoleType roleId;
    // 检查是否是合约部署者
    if (msg.sender == deployer) {
      roleId = RoleType.Admin;
    } else if (_userType == UserType.Institutional && _orgId > 0) {
      // 根据机构类型设置角色
      IInstitutionManager institutionManager = IInstitutionManager(
        institutionManagerAddress
      );
      Institution memory inst = institutionManager.getInstitutionDetail(_orgId);
      if (inst.institutionType == InstitutionType.Hospital) {
        roleId = RoleType.Hospital;
      } else if (inst.institutionType == InstitutionType.Shelter) {
        roleId = RoleType.Shelter;
      } else {
        roleId = RoleType.User;
      }
    } else {
      // 普通用户
      roleId = RoleType.User;
    }

    if (isNewUser) {
      userIds[msg.sender] = userIdCounter;
      users.push();
      uint index = users.length - 1;
      // 创建空的宠物ID数组
      uint[] memory emptyPetIds = new uint[](0);
      User storage newUser = users[index];
      newUser.name = _name;
      newUser.email = _email;
      newUser.phone = _phone;
      newUser.wallet = msg.sender;
      newUser.userType = _userType;
      newUser.orgId = _orgId;
      newUser.isProfileSet = true;
      newUser.roleId = roleId; // 设置角色ID
      newUser.petIds = emptyPetIds; // 设置空的宠物ID数组
      newUser.avatar = _avatar; // 设置头像URL
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
      user.avatar = _avatar; // 更新头像URL
    }
    // 触发用户资料设置事件
    emit UserProfileSet(msg.sender, _name, _userType, _orgId, block.timestamp);
  }

  // 更新用户角色
  function updateUserRole(address _user, RoleType _roleId) external override {
    require(msg.sender == deployer, "Only deployer can update user roles");
    require(_isUserRegistered(_user), "User not registered");
    uint userId = userIds[_user];
    User storage user = users[userId - 1];
    RoleType oldRole = user.roleId;
    user.roleId = _roleId;

    // 触发用户角色更新事件
    emit UserRoleUpdated(_user, oldRole, _roleId, block.timestamp);
  }

  // 添加宠物到用户
  function addPetToUser(address _user, uint _petId) external override {
    // 这里可以添加更多的安全检查，例如验证调用者是否为PetManager合约
    require(_isUserRegistered(_user), "User not registered");
    uint userId = userIds[_user];
    User storage user = users[userId - 1];
    // 检查宠物ID是否已经在用户的宠物列表中
    for (uint i = 0; i < user.petIds.length; i++) {
      if (user.petIds[i] == _petId) {
        return; // 宠物ID已存在，直接返回
      }
    }
    // 添加宠物ID到用户的宠物列表
    user.petIds.push(_petId);
    // 触发宠物添加到用户事件
    emit PetAddedToUser(_user, _petId, block.timestamp);
  }

  // 从用户移除宠物
  function removePetFromUser(address _user, uint _petId) external override {
    // 只允许PetManager合约调用此函数
    // 这里可以添加更多的安全检查，例如验证调用者是否为PetManager合约
    require(_isUserRegistered(_user), "User not registered");

    uint userId = userIds[_user];
    User storage user = users[userId - 1];

    // 从用户的宠物列表中移除宠物ID
    for (uint i = 0; i < user.petIds.length; i++) {
      if (user.petIds[i] == _petId) {
        // 将最后一个元素移到当前位置，然后删除最后一个元素
        user.petIds[i] = user.petIds[user.petIds.length - 1];
        user.petIds.pop();

        // 触发宠物从用户移除事件
        emit PetRemovedFromUser(_user, _petId, block.timestamp);
        break;
      }
    }
  }

  // 获取用户拥有的宠物ID列表
  function getUserPetIds(
    address _user
  ) external view override returns (uint[] memory) {
    require(_isUserRegistered(_user), "User not registered");

    uint userId = userIds[_user];
    User storage user = users[userId - 1];

    return user.petIds;
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
      RoleType roleId,
      string memory avatar
    )
  {
    require(_isUserRegistered(_user), "User not registered");

    uint256 userId = userIds[_user];
    User storage user = users[userId - 1];

    id = userId;
    name = user.name;
    email = user.email;
    phone = user.phone;
    wallet = user.wallet;
    userType = user.userType;
    orgId = user.orgId;
    roleId = user.roleId;
    avatar = user.avatar;

    if (userType == UserType.Institutional && orgId != 0) {
      // 获取机构信息
      IInstitutionManager institutionManager = IInstitutionManager(
        institutionManagerAddress
      );
      Institution memory inst = institutionManager.getInstitutionDetail(orgId);
      orgName = inst.name;
      orgType = inst.institutionType;
    } else {
      orgName = "";
      orgType = InstitutionType.Hospital; // 默认值
    }
  }

  // 获取所有用户
  function getAllUsers() external view override returns (User[] memory) {
    require(msg.sender == deployer, "Only deployer can view all users");

    return users;
  }

  // 注意：以下函数已从合约中移除，因为它们未被前端使用
  // - getUsersByRole
  // - getUsersByInstitution
}
