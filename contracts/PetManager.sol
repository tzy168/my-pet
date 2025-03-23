// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IPetManager.sol";

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

  constructor(address _userManagerAddress) {
    require(_userManagerAddress != address(0), "Invalid user manager address");
    userManagerAddress = _userManagerAddress;
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
    string memory _treatment,
    address _hospital,
    address _doctor
  ) external override {
    require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

    MedicalEvent memory newEvent = MedicalEvent({
      petId: _petId,
      diagnosis: _diagnosis,
      treatment: _treatment,
      timestamp: block.timestamp,
      hospital: _hospital,
      doctor: _doctor
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
}
