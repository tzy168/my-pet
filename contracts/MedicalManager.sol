// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InstitutionManager.sol";
import "./PetManager.sol";

contract MedicalManager {
    // 医疗事件结构体
    struct MedicalEvent {
        uint id;
        uint petId;
        string diagnosis;
        string treatment;
        uint timestamp;
        address hospital;
        address doctor;
    }

    // 存储
    MedicalEvent[] public medicalEvents;
    uint public medicalEventIdCounter = 1;

    // 事件
    event MedicalEventCreated(
        uint indexed eventId,
        uint indexed petId,
        address indexed hospital,
        address doctor,
        uint timestamp
    );

    // 合约引用
    InstitutionManager public institutionManager;
    PetManager public petManager;

    constructor(address _institutionManagerAddress, address _petManagerAddress) {
        institutionManager = InstitutionManager(_institutionManagerAddress);
        petManager = PetManager(_petManagerAddress);
    }

    // 创建医疗事件
    function createMedicalEvent(
        uint _petId,
        string memory _diagnosis,
        string memory _treatment
    ) public {
        // 验证医生身份（必须是医院员工）
        uint hospitalId = institutionManager.getStaffInstitutionId(msg.sender);
        require(hospitalId != 0, "Caller is not hospital staff");

        // 验证医院类型
        (
            ,
            InstitutionManager.InstitutionType institutionType,
            address hospitalAddress,
        ) = institutionManager.getInstitutionInfo(hospitalId);
        require(
            institutionType == InstitutionManager.InstitutionType.Hospital,
            "Staff must be from a hospital"
        );

        // 创建医疗事件
        medicalEvents.push();
        uint index = medicalEvents.length - 1;
        MedicalEvent storage newEvent = medicalEvents[index];
        newEvent.id = medicalEventIdCounter;
        newEvent.petId = _petId;
        newEvent.diagnosis = _diagnosis;
        newEvent.treatment = _treatment;
        newEvent.timestamp = block.timestamp;
        newEvent.hospital = hospitalAddress;
        newEvent.doctor = msg.sender;

        emit MedicalEventCreated(
            medicalEventIdCounter,
            _petId,
            hospitalAddress,
            msg.sender,
            block.timestamp
        );
        medicalEventIdCounter++;
    }

    // 获取宠物的医疗历史
    function getPetMedicalHistory(uint _petId) public view returns (MedicalEvent[] memory) {
        // 计算该宠物的医疗记录数量
        uint count = 0;
        for (uint i = 0; i < medicalEvents.length; i++) {
            if (medicalEvents[i].petId == _petId) {
                count++;
            }
        }

        // 获取医疗记录列表
        MedicalEvent[] memory petMedicalHistory = new MedicalEvent[](count);
        uint currentIndex = 0;
        for (uint i = 0; i < medicalEvents.length; i++) {
            if (medicalEvents[i].petId == _petId) {
                petMedicalHistory[currentIndex] = medicalEvents[i];
                currentIndex++;
            }
        }

        return petMedicalHistory;
    }

    // 获取医疗事件详情
    function getMedicalEventDetails(uint _eventId) public view returns (
        uint id,
        uint petId,
        string memory diagnosis,
        string memory treatment,
        uint timestamp,
        address hospital,
        address doctor
    ) {
        require(_eventId > 0 && _eventId < medicalEventIdCounter, "Medical event does not exist");
        MedicalEvent storage event_ = medicalEvents[_eventId - 1];
        return (
            event_.id,
            event_.petId,
            event_.diagnosis,
            event_.treatment,
            event_.timestamp,
            event_.hospital,
            event_.doctor
        );
    }
}