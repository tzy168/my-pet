// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserManager {
    // 用户类型枚举
    enum UserType {
        Personal,
        Institutional
    }

    // 用户结构体
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

    // 存储和映射
    User[] public users;
    mapping(address => uint256) public userIds; // 用户地址映射到用户ID
    uint256 public userIdCounter = 1;

    // 事件
    event UserRegistered(uint256 indexed userId, address indexed userAddress, string name, UserType userType);

    // 构造函数
    constructor() {}

    // 用户注册
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _phone,
        string memory _password,
        UserType _userType,
        uint _orgId
    ) public {
        require(userIds[msg.sender] == 0, "User already registered");

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

        emit UserRegistered(userIdCounter, msg.sender, _name, _userType);
        userIdCounter++;
    }

    // 检查用户是否已注册
    function isUserRegistered(address _user) public view returns (bool) {
        return userIds[_user] != 0;
    }

    // 获取用户信息
    function getUserInfo(address _userAddress) public view returns (
        uint id,
        string memory name,
        string memory email,
        string memory phone,
        address wallet,
        UserType userType,
        uint orgId
    ) {
        require(isUserRegistered(_userAddress), "User not registered");
        User storage user = users[userIds[_userAddress] - 1];
        return (
            user.id,
            user.name,
            user.email,
            user.phone,
            user.wallet,
            user.userType,
            user.orgId
        );
    }

    // 更新用户信息
    function updateUserInfo(
        string memory _name,
        string memory _email,
        string memory _phone
    ) public {
        require(isUserRegistered(msg.sender), "User not registered");
        User storage user = users[userIds[msg.sender] - 1];
        user.name = _name;
        user.email = _email;
        user.phone = _phone;
    }

    // 添加宠物到用户拥有列表
    function addPetToUser(address _user, uint _petId) public {
        require(isUserRegistered(_user), "User not registered");
        User storage user = users[userIds[_user] - 1];
        user.ownedPets[_petId] = true;
    }

    // 从用户拥有列表中移除宠物
    function removePetFromUser(address _user, uint _petId) public {
        require(isUserRegistered(_user), "User not registered");
        User storage user = users[userIds[_user] - 1];
        delete user.ownedPets[_petId];
    }

    // 检查用户是否拥有特定宠物
    function userOwnsPet(address _user, uint _petId) public view returns (bool) {
        require(isUserRegistered(_user), "User not registered");
        User storage user = users[userIds[_user] - 1];
        return user.ownedPets[_petId];
    }
}