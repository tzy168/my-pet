// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IInstitutionManager.sol";

contract InstitutionManager is IInstitutionManager {
  // 机构存储
  Institution[] public institutions;
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
    address _responsiblePerson
  ) external override {
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
    inst.wallet = _responsiblePerson;
    inst.responsiblePerson = _responsiblePerson;
    staffToInstitution[_responsiblePerson] = newId;
  }

  // 添加员工到机构
  function addStaffToInstitution(
    uint _orgId,
    address _staff
  ) external override {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can add staff"
    );
    staffToInstitution[_staff] = _orgId;
  }

  // 从机构移除员工
  function removeStaffFromInstitution(
    uint _orgId,
    address _staff
  ) external override {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );
    Institution storage inst = institutions[_orgId - 1];
    require(
      msg.sender == inst.responsiblePerson,
      "Only institution responsible person can remove staff"
    );
    staffToInstitution[_staff] = 0;
  }

  // 检查员工是否属于机构
  function isStaffInInstitution(
    uint _orgId,
    address _staff
  ) external view override returns (bool) {
    if (_orgId == 0 || _orgId >= institutionIdCounter) {
      return false;
    }
    return staffToInstitution[_staff] == _orgId;
  }

  // 获取所有机构信息
  function getAllInstitutions()
    external
    view
    override
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

  // 获取机构详细信息
  function getInstitutionDetail(
    uint _orgId
  )
    external
    view
    override
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

  // 获取机构员工列表
  function getInstitutionStaff(
    uint _orgId
  ) external view override returns (address[] memory) {
    require(
      _orgId > 0 && _orgId < institutionIdCounter,
      "Institution does not exist"
    );

    // 计算员工数量
    uint staffCount = 0;
    for (uint i = 0; i < institutionIdCounter; i++) {
      if (staffToInstitution[address(uint160(i))] == _orgId) {
        staffCount++;
      }
    }
    // 创建员工地址数组
    address[] memory staffList = new address[](staffCount);
    uint currentIndex = 0;
    for (uint i = 0; i < institutionIdCounter; i++) {
      address staffAddr = address(uint160(i));
      if (staffToInstitution[staffAddr] == _orgId) {
        staffList[currentIndex] = staffAddr;
        currentIndex++;
      }
    }

    return staffList;
  }
}
