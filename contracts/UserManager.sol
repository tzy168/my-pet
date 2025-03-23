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

  constructor(address _institutionManagerAddress) {
    require(
      _institutionManagerAddress != address(0),
      "Invalid institution manager address"
    );
    institutionManagerAddress = _institutionManagerAddress;
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
      InstitutionType orgType
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
