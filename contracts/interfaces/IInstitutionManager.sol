// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMyPetBase.sol";

interface IInstitutionManager is IMyPetBase {
  // 员工到机构ID的映射
  function staffToInstitution(address) external view returns (uint);

  // 添加机构
  function addInstitution(
    string memory _name,
    InstitutionType _institutionType,
    address _responsiblePerson
  ) external;

  // 添加员工到机构
  function addStaffToInstitution(uint _orgId, address _staff) external;

  // 从机构移除员工
  function removeStaffFromInstitution(uint _orgId, address _staff) external;

  // 检查员工是否属于机构
  function isStaffInInstitution(
    uint _orgId,
    address _staff
  ) external view returns (bool);

  // 获取所有机构信息
  function getAllInstitutions()
    external
    view
    returns (
      uint[] memory,
      string[] memory,
      InstitutionType[] memory,
      address[] memory
    );

  // 获取机构详细信息
  function getInstitutionDetail(
    uint _orgId
  )
    external
    view
    returns (
      uint id,
      string memory name,
      InstitutionType institutionType,
      address wallet,
      address responsiblePerson,
      address[] memory staffList
    );

  // 获取机构员工列表
  function getInstitutionStaff(
    uint _orgId
  ) external view returns (address[] memory);
}
