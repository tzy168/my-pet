// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IInstitutionManager.sol";

/**
 * @title InstitutionManager
 * @dev 机构管理合约，负责医院和救助站的注册、认证与人员管理
 * 包括机构信息更新、员工管理和机构负责人变更等功能
 */
contract InstitutionManager is IInstitutionManager {
  // 机构存储
  Institution[] public institutions;
  // 员工地址到机构ID的映射
  mapping(address => uint) public staffToInstitution;
  uint256 public institutionIdCounter = 1;

  // 合约部署者地址
  address public deployer;

  constructor() {
    deployer = msg.sender;
  }

  // 内部函数：检查机构是否存在
  function _isInstitutionExists(uint _orgId) internal view returns (bool) {
    return _orgId > 0 && _orgId < institutionIdCounter;
  }

  // 添加机构
  function addInstitution(
    string memory _name,
    InstitutionType _institutionType,
    address _responsiblePerson,
    string memory _orgAddress,
    string memory _contactInfo
  ) external override returns (uint) {
    require(msg.sender == deployer, "Only deployer can add institutions");
    require(
      staffToInstitution[_responsiblePerson] == 0,
      "Address already associated with an institution"
    );
    uint newId = institutionIdCounter;
    institutionIdCounter++;
    institutions.push();
    Institution storage inst = institutions[newId - 1];
    inst.id = newId;
    inst.name = _name;
    inst.institutionType = _institutionType;
    inst.responsiblePerson = _responsiblePerson;
    inst.staffList = new address[](0); // 初始化空员工列表
    inst.createdAt = block.timestamp; // 设置创建时间
    inst.orgAddress = _orgAddress; // 设置机构地址
    inst.contactInfo = _contactInfo; // 设置联系信息

    // 将负责人添加到员工列表
    inst.staffList.push(_responsiblePerson);
    staffToInstitution[_responsiblePerson] = newId;

    return newId;
  }

  // 更新机构信息
  function updateInstitution(
    uint _orgId,
    string memory _name, // 名称
    string memory _orgAddress, // 机构地址
    string memory _contactInfo //联系方式
  ) external override {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson || msg.sender == deployer,
      "Only responsible person or deployer can update institution"
    );

    inst.name = _name;
    inst.orgAddress = _orgAddress;
    inst.contactInfo = _contactInfo;
  }

  // 添加员工到机构
  function addStaffToInstitution(
    uint _orgId,
    address _staff
  ) external override {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can add staff"
    );
    require(
      staffToInstitution[_staff] == 0,
      "Staff already associated with an institution"
    );

    staffToInstitution[_staff] = _orgId;
    inst.staffList.push(_staff); // 将员工添加到机构的员工列表中
  }

  // 从机构移除员工
  function removeStaffFromInstitution(
    uint _orgId,
    address _staff
  ) external override {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can remove staff"
    );
    require(
      _staff != inst.responsiblePerson,
      "Cannot remove responsible person"
    );

    staffToInstitution[_staff] = 0;

    // 从机构的员工列表中移除该员工
    for (uint i = 0; i < inst.staffList.length; i++) {
      if (inst.staffList[i] == _staff) {
        // 将最后一个元素移到当前位置，然后删除最后一个元素
        inst.staffList[i] = inst.staffList[inst.staffList.length - 1];
        inst.staffList.pop();
        break;
      }
    }
  }

  // 检查员工是否属于机构
  function isStaffInInstitution(
    uint _orgId,
    address _staff
  ) external view override returns (bool) {
    if (!_isInstitutionExists(_orgId)) {
      return false;
    }
    return staffToInstitution[_staff] == _orgId;
  }

  // 获取所有机构信息
  function getAllInstitutions()
    external
    view
    override
    returns (Institution[] memory)
  {
    Institution[] memory result = new Institution[](institutionIdCounter - 1);
    for (uint i = 1; i < institutionIdCounter; i++) {
      result[i - 1] = institutions[i - 1];
    }
    return result;
  }

  // 获取机构详细信息
  function getInstitutionDetail(
    uint _orgId
  ) external view override returns (Institution memory) {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    return institutions[_orgId - 1];
  }

  // 获取机构员工列表
  function getInstitutionStaff(
    uint _orgId
  ) external view override returns (address[] memory) {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    return institutions[_orgId - 1].staffList;
  }

  // 更新机构负责人
  function updateInstitutionResponsiblePerson(
    uint _orgId,
    address _newResponsiblePerson
  ) external override {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson || msg.sender == deployer,
      "Only current responsible person or deployer can update responsible person"
    );
    require(
      staffToInstitution[_newResponsiblePerson] == 0 ||
        staffToInstitution[_newResponsiblePerson] == _orgId,
      "New responsible person is associated with another institution"
    );

    // 如果新负责人不是当前机构的员工，则添加到员工列表
    if (staffToInstitution[_newResponsiblePerson] == 0) {
      staffToInstitution[_newResponsiblePerson] = _orgId;
      inst.staffList.push(_newResponsiblePerson);
    }

    // 更新负责人
    inst.responsiblePerson = _newResponsiblePerson;
  }

  // 删除机构
  function deleteInstitution(uint _orgId) external override {
    require(_isInstitutionExists(_orgId), "Institution does not exist");
    Institution storage inst = institutions[_orgId - 1];
    require(msg.sender == deployer, "Only deployer can delete institution");

    // 清除所有员工与该机构的关联
    for (uint i = 0; i < inst.staffList.length; i++) {
      address staffAddr = inst.staffList[i];
      if (staffToInstitution[staffAddr] == _orgId) {
        staffToInstitution[staffAddr] = 0;
      }
    }

    // 清空机构数据但保留ID位置（避免影响其他机构的索引）
    delete institutions[_orgId - 1];
  }
}
