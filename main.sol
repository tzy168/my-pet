// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyPet {
    // 定义机构类型：宠物医院 (Hospital) 和动物救助站 (Shelter)
    enum InstitutionType {
        Hospital,
        Shelter
    }

    // 定义用户类型：个人用户 (Personal) 和 机构用户 (Institutional)
    enum UserType {
        Personal,
        Institutional
    }

    // 机构结构体（包含内部的 staff 映射，用于记录员工）
    struct Institution {
        uint id;
        string name;
        InstitutionType institutionType;
        address wallet;
        mapping(address => bool) staff; // 员工映射
        address responsiblePerson;
    }

    // 用户结构体（包含内部 ownedPets 映射，用于记录用户所拥有的宠物）
    struct User {
        uint id;
        string name;
        string email;
        string phone;
        string password;
        address wallet;
        mapping(uint => bool) ownedPets; // 用户拥有宠物映射
        UserType userType; // 用户类型：个人或机构用户
        uint orgId; // 机构用户需关联机构id，个人用户传入 0
    }

    // 领养事件结构体
    struct AdoptionEvent {
        uint petId; // 宠物ID
        address adopter; // 领养者地址
        uint timestamp; // 领养时间
        string notes; // 备注信息
    }
    AdoptionEvent[] public adoptionEvents;

    // 医疗事件结构体
    struct MedicalEvent {
        uint petId; // 宠物ID
        string diagnosis; // 诊断信息
        string treatment; // 治疗方案
        uint timestamp; // 医疗时间
        address hospital; // 医院地址
        address doctor; // 主治医生地址
    }
    MedicalEvent[] public medicalEvents;

    // 救助请求结构体
    struct RescueRequest {
        uint id; // 救助请求ID
        string location; // 救助地点
        string description; // 请求描述
        string status; // 请求状态，如 "pending", "in_progress", "completed"
        uint responderOrgId; // 响应机构ID
        uint timestamp; // 请求时间
    }
    RescueRequest[] public rescueRequests;

    // 宠物结构体
    struct Pet {
        uint id;
        string name;
        string species;
        string breed;
        string gender;
        uint age;
        string description;
        string image;
        string status;
        address owner;
    }
    Pet[] public pets;

    // 机构与用户的存储映射
    mapping(address => Institution) public institutions; // 机构地址映射到机构信息
    mapping(uint => address) public institutionIds; // 机构id映射到机构地址
    mapping(address => address) public staffToInstitution; // 员工地址映射到所属机构
    mapping(address => uint256) public userIds; // 用户地址映射到用户ID
    User[] public users;

    // 自增计数器
    uint public adoptionEventIdCounter = 1;
    uint public petIdCounter = 1;
    uint256 public userIdCounter = 1;
    uint256 public institutionIdCounter = 1;

    // 合约部署者地址
    address public deployer;

    constructor() {
        deployer = msg.sender;
    }

    // 内部函数：检查用户是否已注册
    function _isUserRegistered(address _user) internal view returns (bool) {
        return userIds[_user] != 0;
    }

    // 内部函数：检查机构是否已注册
    function _isInstitutionRegistered(
        address _inst
    ) internal view returns (bool) {
        return institutions[_inst].id != 0;
    }

    // 内部函数：检查机构是否存在
    function _isInstitutionExists(uint _orgId) internal view returns (bool) {
        return institutionIds[_orgId] != address(0);
    }

    /***********************************
     * 用户注册功能（个人/机构用户）
     ***********************************/
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _password,
        UserType _userType,
        uint _orgId // 若为机构用户，此处传入机构id；个人用户传入 0
    ) public {
        // 检查当前地址是否已注册用户
        require(!_isUserRegistered(msg.sender), "User already registered");

        if (_userType == UserType.Institutional) {
            // 机构用户必须关联一个已注册机构
            require(
                _orgId != 0,
                "Institutional user must associate with an institution"
            );
            require(
                _isInstitutionExists(_orgId),
                "Associated institution does not exist"
            );
        } else {
            // 个人用户不能关联机构
            require(
                _orgId == 0,
                "Personal user should not associate with an institution"
            );
        }

        // 分配用户ID并保存映射
        userIds[msg.sender] = userIdCounter;
        users.push();
        uint index = users.length - 1;
        User storage newUser = users[index];
        newUser.id = userIdCounter;
        newUser.name = _name;
        newUser.email = _email;
        newUser.phone = _phone;
        newUser.password = _password;
        newUser.wallet = msg.sender;
        newUser.userType = _userType;
        newUser.orgId = _orgId;
        userIdCounter++;
    }

    /***********************************
     * 机构注册功能（合约部署者添加机构）
     ***********************************/
    function addInstitution(
        uint _id,
        string memory _name,
        InstitutionType _institutionType,
        address _responsiblePerson
    ) public {
        require(msg.sender == deployer, "Only deployer can add institutions");
        require(
            !_isInstitutionExists(_id),
            "Institution with this ID already exists"
        );

        Institution storage inst = institutions[_responsiblePerson];
        inst.id = _id;
        inst.name = _name;
        inst.institutionType = _institutionType;
        inst.wallet = _responsiblePerson;
        inst.responsiblePerson = _responsiblePerson;
        institutionIds[_id] = _responsiblePerson;
    }

    /***********************************
     * 机构负责人添加员工
     ***********************************/
    function addStaffToInstitution(uint _orgId, address _staff) public {
        address instAddress = institutionIds[_orgId];
        require(instAddress != address(0), "Institution does not exist");
        Institution storage inst = institutions[instAddress];
        require(
            msg.sender == inst.responsiblePerson,
            "Only institution responsible person can add staff"
        );
        inst.staff[_staff] = true;
        staffToInstitution[_staff] = instAddress;
    }

    /***********************************
     * 机构负责人移除员工
     ***********************************/
    function removeStaffFromInstitution(uint _orgId, address _staff) public {
        address instAddress = institutionIds[_orgId];
        require(instAddress != address(0), "Institution does not exist");
        Institution storage inst = institutions[instAddress];
        require(
            msg.sender == inst.responsiblePerson,
            "Only institution responsible person can remove staff"
        );
        inst.staff[_staff] = false;
        staffToInstitution[_staff] = address(0);
    }

    /***********************************
     * 检查员工是否属于机构
     ***********************************/
    function isStaffInInstitution(
        uint _orgId,
        address _staff
    ) public view returns (bool) {
        address instAddress = institutionIds[_orgId];
        if (instAddress == address(0)) {
            return false;
        }
        Institution storage inst = institutions[instAddress];
        return inst.staff[_staff];
    }

    /***********************************
     * 获取所有机构信息列表
     ***********************************/
    function getAllInstitutions()
        public
        view
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
            address instAddress = institutionIds[i];
            Institution storage inst = institutions[instAddress];
            ids[i - 1] = inst.id;
            names[i - 1] = inst.name;
            types[i - 1] = inst.institutionType;
            wallets[i - 1] = inst.wallet;
        }

        return (ids, names, types, wallets);
    }
}
