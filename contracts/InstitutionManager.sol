// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract InstitutionManager {
    // 机构类型枚举
    enum InstitutionType {
        Hospital,
        Shelter
    }

    // 机构结构体
    struct Institution {
        uint id;
        string name;
        InstitutionType institutionType;
        address wallet;
        mapping(address => bool) staff; // 员工映射
        address responsiblePerson;
    }

    // 存储和映射
    Institution[] public institutions;
    mapping(address => uint) public institutionAddressToId; // 机构地址映射到机构ID
    mapping(address => address) public staffToInstitution; // 员工地址映射到所属机构
    uint256 public institutionIdCounter = 1;

    // 事件
    event InstitutionRegistered(uint256 indexed institutionId, string name, InstitutionType institutionType);
    event StaffAdded(uint256 indexed institutionId, address indexed staffAddress);
    event StaffRemoved(uint256 indexed institutionId, address indexed staffAddress);

    // 合约部署者地址
    address public deployer;

    constructor() {
        deployer = msg.sender;
    }

    // 修饰器：仅合约部署者可调用
    modifier onlyDeployer() {
        require(msg.sender == deployer, "Only deployer can call this function");
        _;
    }

    // 修饰器：仅机构负责人可调用
    modifier onlyResponsiblePerson(uint _institutionId) {
        require(_institutionId > 0 && _institutionId <= institutions.length, "Institution does not exist");
        require(institutions[_institutionId - 1].responsiblePerson == msg.sender, "Only responsible person can call this function");
        _;
    }

    // 注册新机构
    function registerInstitution(
        string memory _name,
        InstitutionType _institutionType,
        address _responsiblePerson
    ) public onlyDeployer {
        require(institutionAddressToId[_responsiblePerson] == 0, "Institution already registered");

        institutions.push();
        uint index = institutions.length - 1;
        Institution storage newInst = institutions[index];
        newInst.id = institutionIdCounter;
        newInst.name = _name;
        newInst.institutionType = _institutionType;
        newInst.wallet = _responsiblePerson;
        newInst.responsiblePerson = _responsiblePerson;

        institutionAddressToId[_responsiblePerson] = institutionIdCounter;
        emit InstitutionRegistered(institutionIdCounter, _name, _institutionType);
        institutionIdCounter++;
    }

    // 添加员工
    function addStaff(uint _institutionId, address _staffAddress) public onlyResponsiblePerson(_institutionId) {
        require(staffToInstitution[_staffAddress] == address(0), "Staff already registered");
        
        Institution storage inst = institutions[_institutionId - 1];
        inst.staff[_staffAddress] = true;
        staffToInstitution[_staffAddress] = inst.wallet;
        
        emit StaffAdded(_institutionId, _staffAddress);
    }

    // 移除员工
    function removeStaff(uint _institutionId, address _staffAddress) public onlyResponsiblePerson(_institutionId) {
        Institution storage inst = institutions[_institutionId - 1];
        require(inst.staff[_staffAddress], "Staff not found");
        
        delete inst.staff[_staffAddress];
        delete staffToInstitution[_staffAddress];
        
        emit StaffRemoved(_institutionId, _staffAddress);
    }

    // 检查机构是否存在
    function isInstitutionExists(uint _institutionId) public view returns (bool) {
        return _institutionId > 0 && _institutionId <= institutions.length;
    }

    // 检查地址是否为机构员工
    function isStaffOfInstitution(address _staffAddress, uint _institutionId) public view returns (bool) {
        if (!isInstitutionExists(_institutionId)) return false;
        Institution storage inst = institutions[_institutionId - 1];
        return inst.staff[_staffAddress];
    }

    // 获取机构信息
    function getInstitutionInfo(uint _institutionId) public view returns (
        string memory name,
        InstitutionType institutionType,
        address wallet,
        address responsiblePerson
    ) {
        require(isInstitutionExists(_institutionId), "Institution does not exist");
        Institution storage inst = institutions[_institutionId - 1];
        return (
            inst.name,
            inst.institutionType,
            inst.wallet,
            inst.responsiblePerson
        );
    }

    // 获取员工所属机构ID
    function getStaffInstitutionId(address _staffAddress) public view returns (uint) {
        address institutionAddress = staffToInstitution[_staffAddress];
        return institutionAddressToId[institutionAddress];
    }
}