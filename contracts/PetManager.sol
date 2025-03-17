// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserManager.sol";

contract PetManager {
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

    // 领养事件结构体
    struct AdoptionEvent {
        uint petId;
        address adopter;
        uint timestamp;
        string notes;
    }

    // 存储
    Pet[] public pets;
    AdoptionEvent[] public adoptionEvents;
    uint public petIdCounter = 1;
    uint public adoptionEventIdCounter = 1;

    // 事件
    event PetRegistered(uint indexed petId, string name, address owner);
    event PetAdopted(uint indexed petId, address indexed adopter, uint timestamp);
    event AdoptionCancelled(uint indexed petId, address indexed adopter);

    // 用户管理合约引用
    UserManager public userManager;

    constructor(address _userManagerAddress) {
        userManager = UserManager(_userManagerAddress);
    }

    // 注册新宠物
    function registerPet(
        string memory _name,
        string memory _species,
        string memory _breed,
        string memory _gender,
        uint _age,
        string memory _description,
        string memory _image
    ) public {
        require(userManager.isUserRegistered(msg.sender), "User not registered");

        pets.push();
        uint index = pets.length - 1;
        Pet storage newPet = pets[index];
        newPet.id = petIdCounter;
        newPet.name = _name;
        newPet.species = _species;
        newPet.breed = _breed;
        newPet.gender = _gender;
        newPet.age = _age;
        newPet.description = _description;
        newPet.image = _image;
        newPet.status = "available";
        newPet.owner = msg.sender;

        // 更新用户的宠物所有权
        userManager.addPetToUser(msg.sender, petIdCounter);

        emit PetRegistered(petIdCounter, _name, msg.sender);
        petIdCounter++;
    }

    // 创建领养事件
    function createAdoptionEvent(
        uint _petId,
        string memory _notes
    ) public {
        require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
        require(userManager.isUserRegistered(msg.sender), "User not registered");
        Pet storage pet = pets[_petId - 1];
        require(bytes(pet.status).length > 0, "Pet does not exist");
        require(keccak256(bytes(pet.status)) == keccak256(bytes("available")), "Pet is not available for adoption");

        adoptionEvents.push(AdoptionEvent({
            petId: _petId,
            adopter: msg.sender,
            timestamp: block.timestamp,
            notes: _notes
        }));

        // 更新宠物状态
        pet.status = "pending_adoption";

        emit PetAdopted(_petId, msg.sender, block.timestamp);
        adoptionEventIdCounter++;
    }

    // 取消领养
    function cancelAdoption(uint _adoptionEventId) public {
        require(_adoptionEventId > 0 && _adoptionEventId <= adoptionEvents.length, "Adoption event does not exist");
        AdoptionEvent storage adoption = adoptionEvents[_adoptionEventId - 1];
        Pet storage pet = pets[adoption.petId - 1];

        require(
            msg.sender == adoption.adopter || msg.sender == pet.owner,
            "Only adopter or pet owner can cancel adoption"
        );

        // 更新宠物状态
        pet.status = "available";

        // 删除领养事件
        delete adoptionEvents[_adoptionEventId - 1];

        emit AdoptionCancelled(adoption.petId, adoption.adopter);
    }

    // 确认领养
    function confirmAdoption(uint _adoptionEventId) public {
        require(_adoptionEventId > 0 && _adoptionEventId <= adoptionEvents.length, "Adoption event does not exist");
        AdoptionEvent storage adoption = adoptionEvents[_adoptionEventId - 1];
        Pet storage pet = pets[adoption.petId - 1];

        require(pet.owner == msg.sender, "Only pet owner can confirm adoption");

        // 更新用户的宠物所有权
        userManager.removePetFromUser(pet.owner, adoption.petId);
        userManager.addPetToUser(adoption.adopter, adoption.petId);

        // 更新宠物状态和所有者
        pet.status = "adopted";
        pet.owner = adoption.adopter;

        // 删除领养事件
        delete adoptionEvents[_adoptionEventId - 1];
    }

    // 转移宠物所有权
    function transferPetOwnership(uint _petId, address _newOwner) public {
        require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
        require(userManager.isUserRegistered(_newOwner), "New owner not registered");
        Pet storage pet = pets[_petId - 1];
        require(pet.owner == msg.sender, "Only pet owner can transfer ownership");

        // 更新用户的宠物所有权
        userManager.removePetFromUser(msg.sender, _petId);
        userManager.addPetToUser(_newOwner, _petId);

        // 更新宠物所有者
        pet.owner = _newOwner;
    }

    // 获取宠物信息
    function getPetInfo(uint _petId) public view returns (
        string memory name,
        string memory species,
        string memory breed,
        string memory gender,
        uint age,
        string memory description,
        string memory image,
        string memory status,
        address owner
    ) {
        require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");
        Pet storage pet = pets[_petId - 1];
        return (
            pet.name,
            pet.species,
            pet.breed,
            pet.gender,
            pet.age,
            pet.description,
            pet.image,
            pet.status,
            pet.owner
        );
    }

    // 获取宠物的领养历史
    function getPetAdoptionHistory(uint _petId) public view returns (AdoptionEvent[] memory) {
        require(_petId > 0 && _petId < petIdCounter, "Pet does not exist");

        // 计算该宠物的领养记录数量
        uint count = 0;
        for (uint i = 0; i < adoptionEvents.length; i++) {
            if (adoptionEvents[i].petId == _petId) {
                count++;
            }
        }

        // 获取领养记录列表
        AdoptionEvent[] memory petAdoptionHistory = new AdoptionEvent[](count);
        uint currentIndex = 0;
        for (uint i = 0; i < adoptionEvents.length; i++) {
            if (adoptionEvents[i].petId == _petId) {
                petAdoptionHistory[currentIndex] = adoptionEvents[i];
                currentIndex++;
            }
        }

        return petAdoptionHistory;
    }
}