// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IPetManager.sol";
import "./interfaces/IInstitutionManager.sol";
import "./interfaces/IUserManager.sol";

contract PetManager is IPetManager {
  // 宠物存储
  Pet[] public pets;
  uint public petIdCounter = 1;

  // 事件存储
  AdoptionEvent[] public adoptionEvents;
  MedicalEvent[] public medicalEvents;
  RescueRequest[] public rescueRequests;
  uint public adoptionEventIdCounter = 1;
  uint public rescueRequestIdCounter = 1;

  // 用户宠物映射
  mapping(address => mapping(uint => bool)) private userPets;

  // UserManager合约地址
  address public immutable userManagerAddress;
  // InstitutionManager合约地址
  address public immutable institutionManagerAddress;

  constructor(address _userManagerAddress, address _institutionManagerAddress) {
    require(_userManagerAddress != address(0), "Invalid user manager address");
    require(
      _institutionManagerAddress != address(0),
      "Invalid institution manager address"
    );
    userManagerAddress = _userManagerAddress;
    institutionManagerAddress = _institutionManagerAddress;
  }

  // 添加宠物
  function addPet(
    string memory _name,
    string memory _species,
    string memory _breed,
    string memory _gender,
    uint _age,
    string memory _description,
    string memory _image
  ) external override {
    uint newId = petIdCounter;
    petIdCounter++;

    Pet memory newPet = Pet({
      id: newId,
      name: _name,
      species: _species,
      breed: _breed,
      gender: _gender,
      age: _age,
      description: _description,
      image: _image,
      status: "active",
      owner: msg.sender
    });

    pets.push(newPet);
    userPets[msg.sender][newId] = true;
  }

  // 更新宠物信息
  function updatePet(
    uint _petId,
    string memory _name,
    string memory _species,
    string memory _breed,
    string memory _gender,
    uint _age,
    string memory _description,
    string memory _image
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    require(pets[_petId - 1].owner == msg.sender, "Not the pet owner");

    Pet storage pet = pets[_petId - 1];
    pet.name = _name;
    pet.species = _species;
    pet.breed = _breed;
    pet.gender = _gender;
    pet.age = _age;
    pet.description = _description;
    pet.image = _image;
  }

  // 删除宠物
  function removePet(uint _petId) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    require(pets[_petId - 1].owner == msg.sender, "Not the pet owner");

    Pet storage pet = pets[_petId - 1];
    pet.status = "removed";
    pet.owner = address(0);
    userPets[msg.sender][_petId] = false;
  }

  // 获取用户的宠物列表
  function getUserPets(
    address _user
  ) external view override returns (Pet[] memory) {
    uint petCount = 0;
    for (uint i = 1; i < petIdCounter; i++) {
      if (pets[i - 1].owner == _user) {
        petCount++;
      }
    }

    Pet[] memory userPetList = new Pet[](petCount);
    uint currentIndex = 0;

    for (uint i = 1; i < petIdCounter; i++) {
      if (pets[i - 1].owner == _user) {
        userPetList[currentIndex] = pets[i - 1];
        currentIndex++;
      }
    }

    return userPetList;
  }

  // 获取所有宠物列表（仅限医院工作人员和管理员）
  function getAllPets() public view returns (Pet[] memory) {
    // 获取UserManager合约实例
    IUserManager userManager = IUserManager(userManagerAddress);
    
    // 检查用户是否已注册
    require(userManager.checkUserIsRegistered(msg.sender), "User not registered");
    
    // 获取用户信息，包括角色ID
    (,,,,,,,,,IMyPetBase.RoleType roleId) = userManager.getUserInfo(msg.sender);
    
    // 检查用户角色是否为管理员或医院人员
    require(
      roleId == IMyPetBase.RoleType.Admin || roleId == IMyPetBase.RoleType.Hospital,
      "Only admin or hospital staff can view all pets"
    );
    
    return pets;
  }

  // 根据ID获取宠物信息
  function getPetById(uint _petId) external view returns (Pet memory) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    return pets[_petId - 1];
  }

  // 根据名称查找宠物
  function findPetsByName(
    string memory _name
  ) external view returns (Pet[] memory) {
    // 验证调用者是否为医院工作人员
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );
    address institutionAddress = institutionManager.staffToInstitution(
      msg.sender
    );
    require(
      institutionAddress != address(0),
      "Caller is not a staff member of any institution"
    );

    uint institutionId = institutionManager.institutionAddressToId(
      institutionAddress
    );
    (, , IMyPetBase.InstitutionType institutionType, , ) = institutionManager
      .getInstitutionDetail(institutionId);
    require(
      institutionType == IMyPetBase.InstitutionType.Hospital,
      "Caller's institution is not a hospital"
    );

    // 计算匹配的宠物数量
    uint matchCount = 0;
    for (uint i = 1; i < petIdCounter; i++) {
      if (keccak256(bytes(pets[i - 1].name)) == keccak256(bytes(_name))) {
        matchCount++;
      }
    }

    // 创建结果数组
    Pet[] memory result = new Pet[](matchCount);
    uint currentIndex = 0;

    // 填充结果数组
    for (uint i = 1; i < petIdCounter; i++) {
      if (keccak256(bytes(pets[i - 1].name)) == keccak256(bytes(_name))) {
        result[currentIndex] = pets[i - 1];
        currentIndex++;
      }
    }

    return result;
  }

  // 添加领养事件
  function addAdoptionEvent(
    uint _petId,
    address _adopter,
    string memory _notes
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    AdoptionEvent memory newEvent = AdoptionEvent({
      petId: _petId,
      adopter: _adopter,
      timestamp: block.timestamp,
      notes: _notes
    });

    adoptionEvents.push(newEvent);

    // 更新宠物所有者
    Pet storage pet = pets[_petId - 1];
    userPets[pet.owner][_petId] = false;
    pet.owner = _adopter;
    userPets[_adopter][_petId] = true;
  }

  // 添加医疗事件
  function addMedicalEvent(
    uint _petId,
    string memory _diagnosis,
    string memory _treatment
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    // 获取InstitutionManager合约实例
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );

    // 获取医生所属的机构ID
    address institutionAddress = institutionManager.staffToInstitution(
      msg.sender
    );
    require(
      institutionAddress != address(0),
      "Caller is not a staff member of any institution"
    );

    // 确保医生所属机构是医院类型
    uint institutionId = institutionManager.institutionAddressToId(
      institutionAddress
    );
    (, , IMyPetBase.InstitutionType institutionType, , ) = institutionManager
      .getInstitutionDetail(institutionId);
    require(
      institutionType == IMyPetBase.InstitutionType.Hospital,
      "Caller's institution is not a hospital"
    );

    MedicalEvent memory newEvent = MedicalEvent({
      petId: _petId,
      diagnosis: _diagnosis,
      treatment: _treatment,
      timestamp: block.timestamp,
      hospital: institutionAddress,
      doctor: msg.sender
    });

    medicalEvents.push(newEvent);
  }

  // 添加救助请求
  function addRescueRequest(
    string memory _location,
    string memory _description
  ) external override returns (uint) {
    uint newId = rescueRequestIdCounter;
    rescueRequestIdCounter++;

    RescueRequest memory newRequest = RescueRequest({
      id: newId,
      location: _location,
      description: _description,
      status: "pending",
      responderOrgId: 0,
      timestamp: block.timestamp
    });

    rescueRequests.push(newRequest);
    return newId;
  }

  // 更新救助请求状态
  function updateRescueRequestStatus(
    uint _requestId,
    string memory _status,
    uint _responderOrgId
  ) external override {
    require(
      _requestId > 0 && _requestId < rescueRequestIdCounter,
      "Request does not exist"
    );

    RescueRequest storage request = rescueRequests[_requestId - 1];
    request.status = _status;
    request.responderOrgId = _responderOrgId;
  }

  // 获取宠物总数
  function getPetCount() public view returns (uint256) {
    return petIdCounter - 1;
  }

  // 获取宠物的医疗事件数量
  function getMedicalEventCountByPet(
    uint256 _petId
  ) public view returns (uint256) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    uint256 count = 0;
    for (uint256 i = 0; i < medicalEvents.length; i++) {
      if (medicalEvents[i].petId == _petId) {
        count++;
      }
    }
    return count;
  }

  // 获取宠物的特定索引的医疗事件ID
  function getPetMedicalEventAt(
    uint256 _petId,
    uint256 _index
  ) public view returns (uint256) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    uint256 count = 0;
    for (uint256 i = 0; i < medicalEvents.length; i++) {
      if (medicalEvents[i].petId == _petId) {
        if (count == _index) {
          return i;
        }
        count++;
      }
    }
    revert("Index out of bounds");
  }
}
