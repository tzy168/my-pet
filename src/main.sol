// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyPet {
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

  // 机构结构体（包含内部的 staff 映射，用于记录员工）
  struct Institution {
    uint id;
    string name;
    InstitutionType institutionType;
    address wallet;
    mapping(address => bool) staff; // 员工映射
    address responsiblePerson;
  }

  // 用户结构体（包含内部 ownedPets 映射，用于记录用户所拥有的宠物）
  struct User {
    uint id;
    string name;
    string email;
    string phone;
    string password;
    address wallet;
    mapping(uint => bool) ownedPets; // 用户拥有宠物映射
    UserType userType; // 用户类型：个人或机构用户
    uint orgId; // 机构用户需关联机构id，个人用户传入 0
  }

  // 领养事件结构体
  struct AdoptionEvent {
    uint petId; // 宠物ID
    address adopter; // 领养者地址
    uint timestamp; // 领养时间
    string notes; // 备注信息
  }
  AdoptionEvent[] public adoptionEvents;

  // 医疗事件结构体
  struct MedicalEvent {
    uint petId; // 宠物ID
    string diagnosis; // 诊断信息
    string treatment; // 治疗方案
    uint timestamp; // 医疗时间
    address hospital; // 医院地址
    address doctor; // 主治医生地址
  }
  MedicalEvent[] public medicalEvents;

  // 救助请求结构体
  struct RescueRequest {
    uint id; // 救助请求ID
    string location; // 救助地点
    string description; // 请求描述
    string status; // 请求状态，如 "pending", "in_progress", "completed"
    uint responderOrgId; // 响应机构ID
    uint timestamp; // 请求时间
  }
  RescueRequest[] public rescueRequests;

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
  Pet[] public pets;

  // 机构与用户的存储
  Institution[] public institutions; // 机构数组
  mapping(address => uint) public institutionAddressToId; // 机构地址映射到机构ID
  mapping(address => address) public staffToInstitution; // 员工地址映射到所属机构
  mapping(address => uint256) public userIds; // 用户地址映射到用户ID
  User[] public users;

  // 自增计数器
  uint public adoptionEventIdCounter = 1;
  uint public petIdCounter = 1;
  uint256 public userIdCounter = 1;
  uint256 public institutionIdCounter = 1;

  // 合约部署者地址
  address public deployer;

  constructor() {
    deployer = msg.sender;
  }

  // 内部函数：检查用户是否已注册
  function _isUserRegistered(address _user) internal view returns (bool) {
    return userIds[_user] != 0;
  }

  // 内部函数：检查机构是否已注册
  function _isInstitutionRegistered(
    address _inst
  ) internal view returns (bool) {
    uint institutionId = institutionAddressToId[_inst];
    return institutionId != 0;
  }

  // 内部函数：检查机构是否存在
  function _isInstitutionExists(uint _orgId) internal view returns (bool) {
    return _orgId > 0 && _orgId < institutionIdCounter;
  }

  /***********************************
   * 用户注册功能（个人/机构用户）
   ***********************************/
  function registerUser(
    string memory _name,
    string memory _email,
    string memory _phone,
    string memory _password,
    UserType _userType,
    uint _orgId // 若为机构用户，此处传入机构id；个人用户传入 0
  ) public {
    // 检查当前地址是否已注册用户
    require(!_isUserRegistered(msg.sender), "User already registered");

    if (_userType == UserType.Institutional) {
      // 机构用户必须关联一个已注册机构
      require(
        _orgId != 0,
        "Institutional user must associate with an institution"
      );
      require(
        _isInstitutionExists(_orgId),
        "Associated institution does not exist"
      );
    } else {
      // 个人用户不能关联机构
      require(
        _orgId == 0,
        "Personal user should not associate with an institution"
      );
    }

    // 分配用户ID并保存映射
    userIds[msg.sender] = userIdCounter;
    users.push();
    uint index = users.length - 1;
    User storage newUser = users[index];
    newUser.id = userIdCounter;
    newUser.name = _name;
    newUser.email = _email;
    newUser.phone = _phone;
    newUser.password = _password;
    newUser.wallet = msg.sender;
    newUser.userType = _userType;
    newUser.orgId = _orgId;
    userIdCounter++;
  }

  /***********************************
   * 机构注册功能（合约部署者添加机构）
   ***********************************/
  function addInstitution(
    string memory _name,
    InstitutionType _institutionType,
    address _responsiblePerson
  ) public {
    require(msg.sender == deployer, "Only deployer can add institutions");
    require(
      institutionAddressToId[_responsiblePerson] == 0,
      "Address already associated with an institution"
    );

    uint newId = institutionIdCounter;
    institutionIdCounter++;

    institutions.push();
    Institution storage inst = institutions[newId - 1];
    inst.id = newId;
    inst.name = _name;
    inst.institutionType = _institutionType;
    inst.wallet = _responsiblePerson;
    inst.responsiblePerson = _responsiblePerson;
    institutionAddressToId[_responsiblePerson] = newId;
  }

  /***********************************
   * 机构负责人添加员工
   ***********************************/
  function addStaffToInstitution(uint _orgId, address _staff) public {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can add staff"
    );
    inst.staff[_staff] = true;
    staffToInstitution[_staff] = inst.wallet;
  }

  /***********************************
   * 机构负责人移除员工
   ***********************************/
  function removeStaffFromInstitution(uint _orgId, address _staff) public {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can remove staff"
    );
    inst.staff[_staff] = false;
    staffToInstitution[_staff] = address(0);
  }

  /***********************************
   * 检查员工是否属于机构
   ***********************************/
  function isStaffInInstitution(
    uint _orgId,
    address _staff
  ) public view returns (bool) {
    if (_orgId == 0 || _orgId >= institutionIdCounter) {
      return false;
    }
    Institution storage inst = institutions[_orgId - 1];
    return inst.staff[_staff];
  }

  /***********************************
   * 获取所有机构信息列表
   ***********************************/
  function getAllInstitutions()
    public
    view
    returns (
      uint[] memory,
      string[] memory,
      InstitutionType[] memory,
      address[] memory
    )
  {
    uint[] memory ids = new uint[](institutionIdCounter - 1);
    string[] memory names = new string[](institutionIdCounter - 1);
    InstitutionType[] memory types = new InstitutionType[](
      institutionIdCounter - 1
    );
    address[] memory wallets = new address[](institutionIdCounter - 1);

    for (uint i = 1; i < institutionIdCounter; i++) {
      Institution storage inst = institutions[i - 1];
      ids[i - 1] = inst.id;
      names[i - 1] = inst.name;
      types[i - 1] = inst.institutionType;
      wallets[i - 1] = inst.wallet;
    }

    return (ids, names, types, wallets);
  }

  /***********************************
   * 检查用户是否已注册
   ***********************************/
  function checkUserIsRegistered(address _user) public view returns (bool) {
    return _isUserRegistered(_user);
  }

  /***********************************
   * 获取用户注册信息
   ***********************************/
  function getUserInfo(
    address _user
  )
    public
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
      InstitutionType orgType
    )
  {
    require(_isUserRegistered(_user), "User not registered");

    // 获取用户ID
    uint256 userId = userIds[_user];
    // 获取用户信息
    User storage user = users[userId - 1];

    // 获取基本信息
    id = user.id;
    name = user.name;
    email = user.email;
    phone = user.phone;
    wallet = user.wallet;
    userType = user.userType;
    orgId = user.orgId;

    // 如果是机构用户，获取关联的机构信息
    if (userType == UserType.Institutional && orgId != 0) {
      Institution storage inst = institutions[orgId - 1];
      orgName = inst.name;
      orgType = inst.institutionType;
    } else {
      orgName = "";
      orgType = InstitutionType.Hospital; // 默认值
    }
  }

  /***********************************
   * 获取机构详细信息
   ***********************************/
  function getInstitutionDetail(
    uint _orgId
  )
    public
    view
    returns (
      uint id,
      string memory name,
      InstitutionType institutionType,
      address wallet,
      address responsiblePerson
    )
  {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );

    Institution storage inst = institutions[_orgId - 1];
    return (
      inst.id,
      inst.name,
      inst.institutionType,
      inst.wallet,
      inst.responsiblePerson
    );
  }

  /***********************************
   * 获取机构员工列表
   ***********************************/
  function getInstitutionStaff(
    uint _orgId
  ) public view returns (address[] memory) {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );
    Institution storage inst = institutions[_orgId - 1];

    // 遍历所有用户找到属于该机构的员工
    uint staffCount = 0;
    for (uint i = 0; i < userIdCounter - 1; i++) {
      if (staffToInstitution[users[i].wallet] == inst.wallet) {
        staffCount++;
      }
    }

    address[] memory staffList = new address[](staffCount);
    uint currentIndex = 0;
    for (uint i = 0; i < userIdCounter - 1; i++) {
      if (staffToInstitution[users[i].wallet] == inst.wallet) {
        staffList[currentIndex] = users[i].wallet;
        currentIndex++;
      }
    }

    return staffList;
  }
}
