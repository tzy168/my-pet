// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./InstitutionManager.sol";

contract RescueManager {
    // 救助请求结构体
    struct RescueRequest {
        uint id;
        string location;
        string description;
        string status;
        uint responderOrgId;
        uint timestamp;
    }

    // 存储
    RescueRequest[] public rescueRequests;
    uint public rescueRequestIdCounter = 1;

    // 事件
    event RescueRequestCreated(
        uint indexed requestId,
        string location,
        uint timestamp
    );
    event RescueRequestAssigned(
        uint indexed requestId,
        uint indexed orgId,
        uint timestamp
    );
    event RescueRequestCompleted(
        uint indexed requestId,
        uint timestamp
    );

    // 合约引用
    InstitutionManager public institutionManager;
    address public deployer;

    constructor(address _institutionManagerAddress) {
        institutionManager = InstitutionManager(_institutionManagerAddress);
        deployer = msg.sender;
    }

    // 创建救助请求
    function createRescueRequest(
        string memory _location,
        string memory _description
    ) public {
        rescueRequests.push();
        uint index = rescueRequests.length - 1;
        RescueRequest storage newRequest = rescueRequests[index];
        newRequest.id = rescueRequestIdCounter;
        newRequest.location = _location;
        newRequest.description = _description;
        newRequest.status = "pending";
        newRequest.timestamp = block.timestamp;

        emit RescueRequestCreated(
            rescueRequestIdCounter,
            _location,
            block.timestamp
        );
        rescueRequestIdCounter++;
    }

    // 分配救助机构
    function assignRescueOrganization(
        uint _requestId,
        uint _orgId
    ) public {
        require(_requestId > 0 && _requestId <= rescueRequests.length, "Request does not exist");
        require(institutionManager.isInstitutionExists(_orgId), "Organization does not exist");
        RescueRequest storage request = rescueRequests[_requestId - 1];

        // 检查机构类型是否为救助站
        (
            ,
            InstitutionManager.InstitutionType institutionType,
            ,
        ) = institutionManager.getInstitutionInfo(_orgId);
        require(
            institutionType == InstitutionManager.InstitutionType.Shelter,
            "Only shelter can be assigned to rescue request"
        );

        // 只有合约部署者可以分配救助机构
        require(msg.sender == deployer, "Only deployer can assign rescue organization");

        request.responderOrgId = _orgId;
        request.status = "in_progress";

        emit RescueRequestAssigned(_requestId, _orgId, block.timestamp);
    }

    // 完成救助请求
    function completeRescueRequest(uint _requestId) public {
        require(_requestId > 0 && _requestId <= rescueRequests.length, "Request does not exist");
        RescueRequest storage request = rescueRequests[_requestId - 1];

        // 验证调用者是否为被分配的救助站的员工
        require(
            institutionManager.isStaffOfInstitution(msg.sender, request.responderOrgId),
            "Only assigned shelter staff can complete request"
        );

        request.status = "completed";
        emit RescueRequestCompleted(_requestId, block.timestamp);
    }

    // 获取所有救助请求
    function getAllRescueRequests() public view returns (RescueRequest[] memory) {
        return rescueRequests;
    }

    // 获取机构的救助请求
    function getOrganizationRescueRequests(uint _orgId) public view returns (RescueRequest[] memory) {
        require(institutionManager.isInstitutionExists(_orgId), "Organization does not exist");

        // 计算该机构的救助请求数量
        uint count = 0;
        for (uint i = 0; i < rescueRequests.length; i++) {
            if (rescueRequests[i].responderOrgId == _orgId) {
                count++;
            }
        }

        // 获取救助请求列表
        RescueRequest[] memory orgRequests = new RescueRequest[](count);
        uint currentIndex = 0;
        for (uint i = 0; i < rescueRequests.length; i++) {
            if (rescueRequests[i].responderOrgId == _orgId) {
                orgRequests[currentIndex] = rescueRequests[i];
                currentIndex++;
            }
        }

        return orgRequests;
    }

    // 获取救助请求详情
    function getRescueRequestDetails(uint _requestId) public view returns (
        uint id,
        string memory location,
        string memory description,
        string memory status,
        uint responderOrgId,
        uint timestamp
    ) {
        require(_requestId > 0 && _requestId <= rescueRequests.length, "Request does not exist");
        RescueRequest storage request = rescueRequests[_requestId - 1];
        return (
            request.id,
            request.location,
            request.description,
            request.status,
            request.responderOrgId,
            request.timestamp
        );
    }
}