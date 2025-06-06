// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IPetManager.sol";
import "./interfaces/IInstitutionManager.sol";
import "./interfaces/IUserManager.sol";

/**
 * @title PetManager
 * @dev 宠物管理合约，负责宠物信息登记与更新、健康状态和领养状态管理、
 * 领养事件记录、医疗事件记录和救助请求处理
 */
contract PetManager is IPetManager {
  // 事件定义
  event PetAdded(
    uint indexed petId,
    string name,
    address indexed owner,
    uint timestamp
  );
  event PetUpdated(
    uint indexed petId,
    string name,
    address indexed owner,
    uint timestamp
  );
  event PetHealthStatusUpdated(
    uint indexed petId,
    PetHealthStatus healthStatus,
    address updatedBy,
    uint timestamp
  );
  event PetAdoptionStatusUpdated(
    uint indexed petId,
    PetAdoptionStatus adoptionStatus,
    address updatedBy,
    uint timestamp
  );
  event PetRemoved(
    uint indexed petId,
    address indexed previousOwner,
    uint timestamp
  );
  event AdoptionEventAdded(
    uint indexed eventId,
    uint indexed petId,
    address indexed adopter,
    address previousOwner,
    uint timestamp
  );
  event MedicalEventAdded(
    uint indexed eventId,
    uint indexed petId,
    address indexed doctor,
    uint hospitalId,
    uint timestamp
  );
  event RescueRequestAdded(
    uint indexed requestId,
    address indexed requester,
    string location,
    uint urgencyLevel,
    uint timestamp
  );
  event RescueRequestStatusUpdated(
    uint indexed requestId,
    string status,
    uint responderOrgId,
    uint timestamp
  );
  // 宠物存储
  Pet[] public pets;
  uint public petIdCounter = 1;

  // 事件存储
  AdoptionEvent[] public adoptionEvents;
  MedicalEvent[] public medicalEvents;
  RescueRequest[] public rescueRequests;
  uint public adoptionEventIdCounter = 1;
  uint public medicalEventIdCounter = 1;
  uint public rescueRequestIdCounter = 1;

  // 交易哈希存储
  mapping(uint256 => string) public transactionHashes;
  uint256 public hashCount;

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
    string memory _name, // 宠物名称
    string memory _species, // 宠物种类
    string memory _breed, // 宠物品种
    string memory _gender, // 宠物性别
    uint _age, // 宠物年龄
    string memory _description, // 宠物描述
    string[] memory _images, // 宠物图片数组
    PetHealthStatus _healthStatus, // 宠物健康状态
    PetAdoptionStatus _adoptionStatus // 宠物领养状态
  ) external override returns (uint) {
    uint newId = petIdCounter;
    petIdCounter++;
    // 创建空的医疗记录ID数组
    uint[] memory emptyMedicalRecords = new uint[](0);
    Pet memory newPet = Pet({
      id: newId,
      name: _name,
      species: _species,
      breed: _breed,
      gender: _gender,
      age: _age,
      description: _description,
      images: _images,
      healthStatus: _healthStatus,
      adoptionStatus: _adoptionStatus,
      owner: msg.sender,
      medicalRecordIds: emptyMedicalRecords,
      lastUpdatedAt: block.timestamp
    });
    pets.push(newPet);
    userPets[msg.sender][newId] = true;
    // 更新用户的宠物列表
    IUserManager userManager = IUserManager(userManagerAddress);
    if (userManager.checkUserIsRegistered(msg.sender)) {
      userManager.addPetToUser(msg.sender, newId);
    }
    // 触发宠物添加事件
    emit PetAdded(newId, _name, msg.sender, block.timestamp);
    return newId;
  }

  // 更新宠物信息
  function updatePet(
    uint _petId, // 宠物ID
    string memory _name, // 宠物名称
    string memory _species, // 宠物种类
    string memory _breed, // 宠物品种
    string memory _gender, // 宠物性别
    uint _age, // 宠物年龄
    string memory _description, // 宠物描述
    string[] memory _images, // 宠物图片数组
    PetHealthStatus _healthStatus, // 宠物健康状态
    PetAdoptionStatus _adoptionStatus // 宠物领养状态
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
    pet.images = _images;
    pet.healthStatus = _healthStatus;
    pet.adoptionStatus = _adoptionStatus;
    pet.lastUpdatedAt = block.timestamp;
    // 触发宠物更新事件
    emit PetUpdated(_petId, _name, msg.sender, block.timestamp);
  }

  // 更新宠物健康状态
  function updatePetHealthStatus(
    uint _petId,
    PetHealthStatus _healthStatus
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    // 验证调用者是否为医院工作人员或宠物主人
    Pet storage pet = pets[_petId - 1];
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );
    uint institutionId = institutionManager.staffToInstitution(msg.sender);

    bool isHospitalStaff = false;
    if (institutionId != 0) {
      Institution memory inst = institutionManager.getInstitutionDetail(
        institutionId
      );
      isHospitalStaff = inst.institutionType == InstitutionType.Hospital;
    }

    require(
      pet.owner == msg.sender || isHospitalStaff,
      "Only pet owner or hospital staff can update health status"
    );

    pet.healthStatus = _healthStatus;
    pet.lastUpdatedAt = block.timestamp;

    // 触发宠物健康状态更新事件
    emit PetHealthStatusUpdated(
      _petId,
      _healthStatus,
      msg.sender,
      block.timestamp
    );
  }

  // 更新宠物领养状态
  function updatePetAdoptionStatus(
    uint _petId,
    PetAdoptionStatus _adoptionStatus
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    // 验证调用者是否为救助站工作人员或宠物主人
    Pet storage pet = pets[_petId - 1];
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );
    uint institutionId = institutionManager.staffToInstitution(msg.sender);

    bool isShelterStaff = false;
    if (institutionId != 0) {
      Institution memory inst = institutionManager.getInstitutionDetail(
        institutionId
      );
      isShelterStaff = inst.institutionType == InstitutionType.Shelter;
    }

    require(
      pet.owner == msg.sender || isShelterStaff,
      "Only pet owner or shelter staff can update adoption status"
    );

    pet.adoptionStatus = _adoptionStatus;
    pet.lastUpdatedAt = block.timestamp;

    // 触发宠物领养状态更新事件
    emit PetAdoptionStatusUpdated(
      _petId,
      _adoptionStatus,
      msg.sender,
      block.timestamp
    );
  }

  // 删除宠物
  function removePet(uint _petId) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    require(pets[_petId - 1].owner == msg.sender, "Not the pet owner");

    Pet storage pet = pets[_petId - 1];
    address previousOwner = pet.owner;
    pet.adoptionStatus = PetAdoptionStatus.NotAvailable;
    pet.owner = address(0);
    pet.lastUpdatedAt = block.timestamp;
    userPets[msg.sender][_petId] = false;

    // 从用户的宠物列表中移除
    IUserManager userManager = IUserManager(userManagerAddress);
    if (userManager.checkUserIsRegistered(msg.sender)) {
      userManager.removePetFromUser(msg.sender, _petId);
    }

    // 触发宠物删除事件
    emit PetRemoved(_petId, previousOwner, block.timestamp);
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

  // 获取所有宠物
  function getAllPets() external view override returns (Pet[] memory) {
    // 获取UserManager合约实例
    IUserManager userManager = IUserManager(userManagerAddress);

    // 检查用户是否已注册
    require(
      userManager.checkUserIsRegistered(msg.sender),
      "User not registered"
    );

    // 获取用户信息，包括角色ID
    (, , , , , , , , , RoleType roleId, ) = userManager.getUserInfo(msg.sender);

    // 检查用户角色是否为管理员或医院人员
    require(
      roleId == RoleType.Admin || roleId == RoleType.Hospital,
      "Only admin or hospital staff can view all pets"
    );

    return pets;
  }

  // 根据ID获取宠物
  function getPetById(uint _petId) external view override returns (Pet memory) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    return pets[_petId - 1];
  }

  // 根据领养状态获取宠物
  function getPetsByAdoptionStatus(
    PetAdoptionStatus _status
  ) external view override returns (Pet[] memory) {
    // 计算符合条件的宠物数量
    uint count = 0;
    for (uint i = 0; i < pets.length; i++) {
      if (pets[i].adoptionStatus == _status) {
        count++;
      }
    }
    // 创建结果数组
    Pet[] memory result = new Pet[](count);
    uint currentIndex = 0;
    // 填充结果数组
    for (uint i = 0; i < pets.length; i++) {
      if (pets[i].adoptionStatus == _status) {
        result[currentIndex] = pets[i];
        currentIndex++;
      }
    }

    return result;
  }

  // 添加领养事件
  function addAdoptionEvent(
    uint _petId,
    address _adopter,
    string memory _notes,
    uint _institutionId
  ) external override returns (uint) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    // 获取当前宠物所有者作为前任主人
    Pet storage pet = pets[_petId - 1];
    // 检查宠物是否已被领养
    require(pet.adoptionStatus != PetAdoptionStatus.Adopted, "Pet is already adopted");
    address previousOwner = pet.owner;

    uint newId = adoptionEventIdCounter;
    adoptionEventIdCounter++;

    AdoptionEvent memory newEvent = AdoptionEvent({
      id: newId,
      petId: _petId,
      adopter: _adopter,
      timestamp: block.timestamp,
      notes: _notes,
      previousOwner: previousOwner,
      institutionId: _institutionId
    });

    adoptionEvents.push(newEvent);

    // 更新宠物所有者和状态
    userPets[pet.owner][_petId] = false;
    pet.owner = _adopter;
    pet.adoptionStatus = PetAdoptionStatus.Adopted;
    pet.lastUpdatedAt = block.timestamp;
    userPets[_adopter][_petId] = true;

    // 更新用户的宠物列表
    IUserManager userManager = IUserManager(userManagerAddress);
    if (userManager.checkUserIsRegistered(previousOwner)) {
      userManager.removePetFromUser(previousOwner, _petId);
    }
    if (userManager.checkUserIsRegistered(_adopter)) {
      userManager.addPetToUser(_adopter, _petId);
    }

    // 触发领养事件添加事件
    emit AdoptionEventAdded(
      newId,
      _petId,
      _adopter,
      previousOwner,
      block.timestamp
    );

    return newId;
  }

  // 获取领养事件
  function getAdoptionEvent(
    uint _eventId
  ) external view override returns (AdoptionEvent memory) {
    require(
      _eventId > 0 && _eventId < adoptionEventIdCounter,
      "Adoption event does not exist"
    );
    return adoptionEvents[_eventId - 1];
  }

  // 获取宠物的领养历史
  function getPetAdoptionHistory(
    uint _petId
  ) external view override returns (AdoptionEvent[] memory) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    // 计算该宠物的领养事件数量
    uint count = 0;
    for (uint i = 0; i < adoptionEvents.length; i++) {
      if (adoptionEvents[i].petId == _petId) {
        count++;
      }
    }

    // 创建结果数组
    AdoptionEvent[] memory result = new AdoptionEvent[](count);
    uint currentIndex = 0;

    // 填充结果数组
    for (uint i = 0; i < adoptionEvents.length; i++) {
      if (adoptionEvents[i].petId == _petId) {
        result[currentIndex] = adoptionEvents[i];
        currentIndex++;
      }
    }

    return result;
  }

  // 添加医疗事件
  function addMedicalEvent(
    uint _petId,
    string memory _diagnosis,
    string memory _treatment,
    uint _cost,
    string[] memory _attachments
  ) external override returns (uint) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
    require(bytes(_diagnosis).length > 0, "Diagnosis cannot be empty");
    require(bytes(_treatment).length > 0, "Treatment cannot be empty");
    // 获取InstitutionManager合约实例
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );
    // 获取医生所属的机构ID
    uint institutionId = institutionManager.staffToInstitution(msg.sender);
    require(
      institutionId != 0,
      "Caller is not a staff member of any institution"
    );
    // 确保医生所属机构是医院类型
    Institution memory inst = institutionManager.getInstitutionDetail(
      institutionId
    );
    require(
      inst.institutionType == InstitutionType.Hospital,
      "Caller's institution is not a hospital"
    );
    // 生成新的医疗记录ID
    uint newId = medicalEventIdCounter;
    medicalEventIdCounter++;
    MedicalEvent memory newEvent = MedicalEvent({
      id: newId,
      petId: _petId,
      diagnosis: _diagnosis,
      treatment: _treatment,
      timestamp: block.timestamp,
      hospital: institutionId,
      doctor: msg.sender,
      cost: _cost,
      attachments: _attachments
    });
    medicalEvents.push(newEvent);
    // 更新宠物的医疗记录ID列表
    Pet storage pet = pets[_petId - 1];
    uint[] memory newMedicalRecords = new uint[](
      pet.medicalRecordIds.length + 1
    );
    for (uint i = 0; i < pet.medicalRecordIds.length; i++) {
      newMedicalRecords[i] = pet.medicalRecordIds[i];
    }
    newMedicalRecords[pet.medicalRecordIds.length] = newId;
    pet.medicalRecordIds = newMedicalRecords;
    pet.lastUpdatedAt = block.timestamp;
    // 触发医疗事件添加事件
    emit MedicalEventAdded(
      newId,
      _petId,
      msg.sender,
      institutionId,
      block.timestamp
    );
    return newId;
  }

  // 存储交易哈希
  function storeTransactionHash(string memory _hash) external {
    transactionHashes[hashCount] = _hash;
    hashCount++;
  }

  // 获取医疗事件
  function getMedicalEvent(
    uint _eventId
  ) external view override returns (MedicalEvent memory) {
    require(
      _eventId > 0 && _eventId < medicalEventIdCounter,
      "Medical event does not exist"
    );
    return medicalEvents[_eventId - 1];
  }

  // 获取宠物的医疗记录
  function getPetMedicalHistory(
    uint _petId
  ) external view override returns (MedicalEvent[] memory) {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    // 计算该宠物的医疗事件数量
    uint count = 0;
    for (uint i = 0; i < medicalEvents.length; i++) {
      if (medicalEvents[i].petId == _petId) {
        count++;
      }
    }

    // 创建结果数组
    MedicalEvent[] memory result = new MedicalEvent[](count);
    uint currentIndex = 0;

    // 填充结果数组
    for (uint i = 0; i < medicalEvents.length; i++) {
      if (medicalEvents[i].petId == _petId) {
        result[currentIndex] = medicalEvents[i];
        currentIndex++;
      }
    }

    return result;
  }

  // 添加救助请求
  function addRescueRequest(
    string memory _location,
    string memory _description,
    string[] memory _images,
    uint _urgencyLevel
  ) external override returns (uint) {
    uint newId = rescueRequestIdCounter;
    rescueRequestIdCounter++;

    RescueRequest memory newRequest = RescueRequest({
      id: newId,
      location: _location,
      description: _description,
      status: "pending",
      responderOrgId: 0,
      timestamp: block.timestamp,
      requester: msg.sender,
      images: _images,
      urgencyLevel: _urgencyLevel
    });
    rescueRequests.push(newRequest);
    // 触发救助请求添加事件
    emit RescueRequestAdded(
      newId,
      msg.sender,
      _location,
      _urgencyLevel,
      block.timestamp
    );
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

    // 验证调用者是否为救助站工作人员
    IInstitutionManager institutionManager = IInstitutionManager(
      institutionManagerAddress
    );
    uint institutionId = institutionManager.staffToInstitution(msg.sender);
    require(
      institutionId != 0,
      "Caller is not a staff member of any institution"
    );

    Institution memory inst = institutionManager.getInstitutionDetail(
      institutionId
    );
    require(
      inst.institutionType == InstitutionType.Shelter,
      "Only shelter staff can update rescue request status"
    );

    RescueRequest storage request = rescueRequests[_requestId - 1];
    request.status = _status;
    request.responderOrgId = _responderOrgId;

    // 触发救助请求状态更新事件
    emit RescueRequestStatusUpdated(
      _requestId,
      _status,
      _responderOrgId,
      block.timestamp
    );
  }

  // 获取救助请求
  function getRescueRequest(
    uint _requestId
  ) external view override returns (RescueRequest memory) {
    require(
      _requestId > 0 && _requestId < rescueRequestIdCounter,
      "Request does not exist"
    );
    return rescueRequests[_requestId - 1];
  }

  // 获取所有救助请求
  function getAllRescueRequests()
    external
    view
    override
    returns (RescueRequest[] memory)
  {
    return rescueRequests;
  }

  // 获取用户的救助请求
  function getUserRescueRequests(
    address _user
  ) external view returns (RescueRequest[] memory) {
    // 计算用户的救助请求数量
    uint count = 0;
    for (uint i = 0; i < rescueRequests.length; i++) {
      if (rescueRequests[i].requester == _user) {
        count++;
      }
    }

    // 创建结果数组
    RescueRequest[] memory result = new RescueRequest[](count);
    uint currentIndex = 0;

    // 填充结果数组
    for (uint i = 0; i < rescueRequests.length; i++) {
      if (rescueRequests[i].requester == _user) {
        result[currentIndex] = rescueRequests[i];
        currentIndex++;
      }
    }

    return result;
  }

  // 添加交易哈希
  function addTransactionHash(string memory _hash) external override returns (uint256) {
    transactionHashes[hashCount] = _hash;
    uint256 currentId = hashCount;
    hashCount++;
    return currentId;
  }
}
