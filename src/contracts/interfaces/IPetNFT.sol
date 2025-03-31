// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IPetManager.sol";

interface IPetNFT is IPetManager {
  // 添加宠物并铸造NFT
  function addPet(
    string memory _name,
    string memory _species,
    string memory _breed,
    string memory _gender,
    uint _age,
    string memory _description,
    string memory _image,
    PetHealthStatus _healthStatus,
    PetAdoptionStatus _adoptionStatus,
    string memory _tokenURI
  ) external returns (uint);

  // 销毁宠物NFT
  function burnPet(uint _petId) external;

  // 领养宠物（转移所有权）
  function adoptPet(
    uint _petId,
    string memory _notes,
    uint _institutionId
  ) external;

  // 获取NFT的URI
  function tokenURI(uint256 tokenId) external view returns (string memory);

  // 检查是否支持特定接口
  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
