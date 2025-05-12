// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMyPetBase.sol";

interface IPetManager is IMyPetBase {
  // 添加宠物
  function addPet(
    string memory _name,
    string memory _species,
    string memory _breed,
    string memory _gender,
    uint _age,
    string memory _description,
    string[] memory _images,
    PetHealthStatus _healthStatus,
    PetAdoptionStatus _adoptionStatus
  ) external returns (uint);

  // 更新宠物信息
  function updatePet(
    uint _petId,
    string memory _name,
    string memory _species,
    string memory _breed,
    string memory _gender,
    uint _age,
    string memory _description,
    string[] memory _images,
    PetHealthStatus _healthStatus,
    PetAdoptionStatus _adoptionStatus
  ) external;

  // 更新宠物健康状态
  function updatePetHealthStatus(
    uint _petId,
    PetHealthStatus _healthStatus
  ) external;

  // 更新宠物领养状态
  function updatePetAdoptionStatus(
    uint _petId,
    PetAdoptionStatus _adoptionStatus
  ) external;

  // 删除宠物
  function removePet(uint _petId) external;

  // 获取用户的宠物列表
  function getUserPets(address _user) external view returns (Pet[] memory);

  // 获取所有宠物
  function getAllPets() external view returns (Pet[] memory);

  // 根据ID获取宠物
  function getPetById(uint _petId) external view returns (Pet memory);



  // 根据领养状态获取宠物
  function getPetsByAdoptionStatus(PetAdoptionStatus _status) external view returns (Pet[] memory);

  // 添加领养事件
  function addAdoptionEvent(
    uint _petId,
    address _adopter,
    string memory _notes,
    uint _institutionId
  ) external returns (uint);

  // 获取领养事件
  function getAdoptionEvent(uint _eventId) external view returns (AdoptionEvent memory);

  // 获取宠物的领养历史
  function getPetAdoptionHistory(uint _petId) external view returns (AdoptionEvent[] memory);

  // 添加医疗事件
  function addMedicalEvent(
    uint _petId,
    string memory _diagnosis,
    string memory _treatment,
    uint _cost,
    string[] memory _attachments
  ) external returns (uint);

  // 获取医疗事件
  function getMedicalEvent(uint _eventId) external view returns (MedicalEvent memory);

  // 获取宠物的医疗记录
  function getPetMedicalHistory(uint _petId) external view returns (MedicalEvent[] memory);

  // 添加救助请求
  function addRescueRequest(
    string memory _location,
    string memory _description,
    string[] memory _images,
    uint _urgencyLevel
  ) external returns (uint);

  // 更新救助请求状态
  function updateRescueRequestStatus(
    uint _requestId,
    string memory _status,
    uint _responderOrgId
  ) external;

  // 获取救助请求
  function getRescueRequest(uint _requestId) external view returns (RescueRequest memory);

  // 获取所有救助请求
  function getAllRescueRequests() external view returns (RescueRequest[] memory);

  // 添加交易哈希
  function addTransactionHash(string memory _hash) external returns (uint256);
}
