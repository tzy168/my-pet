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
    string memory _image
  ) external;

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
  ) external;

  // 删除宠物
  function removePet(uint _petId) external;

  // 获取用户的宠物列表
  function getUserPets(address _user) external view returns (Pet[] memory);

  // 添加领养事件
  function addAdoptionEvent(
    uint _petId,
    address _adopter,
    string memory _notes
  ) external;

  // 添加医疗事件
  function addMedicalEvent(
    uint _petId,
    string memory _diagnosis,
    string memory _treatment
  ) external;

  // 添加救助请求
  function addRescueRequest(
    string memory _location,
    string memory _description
  ) external returns (uint);

  // 更新救助请求状态
  function updateRescueRequestStatus(
    uint _requestId,
    string memory _status,
    uint _responderOrgId
  ) external;
}
