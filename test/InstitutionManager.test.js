const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InstitutionManager", function () {
  let institutionManager;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const InstitutionManager = await ethers.getContractFactory("InstitutionManager");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // 部署合约
    institutionManager = await InstitutionManager.deploy();
    await institutionManager.waitForDeployment();
  });

  describe("部署", function () {
    it("应该设置正确的部署者", async function () {
      expect(await institutionManager.deployer()).to.equal(owner.address);
    });

    it("初始机构ID计数器应该为1", async function () {
      expect(await institutionManager.institutionIdCounter()).to.equal(1);
    });
  });

  describe("添加机构", function () {
    it("部署者应该能够添加机构", async function () {
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, // Hospital类型
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );

      // 验证机构ID计数器增加
      expect(await institutionManager.institutionIdCounter()).to.equal(2);

      // 验证机构信息
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
      expect(institutionDetail.orgAddress).to.equal("北京市海淀区");
      expect(institutionDetail.contactInfo).to.equal("010-12345678");
      expect(institutionDetail.staffList.length).to.equal(1); // 负责人自动添加为员工
      expect(institutionDetail.staffList[0]).to.equal(addr1.address);
    });

    it("非部署者不应该能够添加机构", async function () {
      await expect(
        institutionManager.connect(addr1).addInstitution(
          "宠物医院B", 
          0, 
          addr2.address,
          "上海市浦东新区",
          "021-87654321"
        )
      ).to.be.revertedWith("Only deployer can add institutions");
    });

    it("不应该允许将同一地址添加为多个机构的负责人", async function () {
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );

      await expect(
        institutionManager.addInstitution(
          "宠物医院B", 
          0, 
          addr1.address,
          "上海市浦东新区",
          "021-87654321"
        )
      ).to.be.revertedWith("Address already associated with an institution");
    });

    it("应该能够添加不同类型的机构", async function () {
      // 添加医院类型机构
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );

      // 添加救助站类型机构
      await institutionManager.addInstitution(
        "救助站B", 
        1, 
        addr2.address,
        "广州市天河区",
        "020-98765432"
      );

      // 验证机构类型
      const hospitalDetail = await institutionManager.getInstitutionDetail(1);
      expect(hospitalDetail.institutionType).to.equal(0); // Hospital

      const shelterDetail = await institutionManager.getInstitutionDetail(2);
      expect(shelterDetail.institutionType).to.equal(1); // Shelter
    });
  });

  describe("更新机构信息", function () {
    beforeEach(async function () {
      // 添加一个机构用于测试
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );
    });

    it("机构负责人应该能够更新机构信息", async function () {
      await institutionManager.connect(addr1).updateInstitution(
        1,
        "宠物医院A更新",
        "北京市朝阳区",
        "010-87654321"
      );

      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A更新");
      expect(institutionDetail.orgAddress).to.equal("北京市朝阳区");
      expect(institutionDetail.contactInfo).to.equal("010-87654321");
    });

    it("部署者应该能够更新任何机构信息", async function () {
      await institutionManager.connect(owner).updateInstitution(
        1,
        "宠物医院A管理员更新",
        "北京市西城区",
        "010-11112222"
      );

      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A管理员更新");
    });

    it("非机构负责人和非部署者不应该能够更新机构信息", async function () {
      await expect(
        institutionManager.connect(addr2).updateInstitution(
          1,
          "宠物医院A非法更新",
          "非法地址",
          "非法联系方式"
        )
      ).to.be.revertedWith("Only responsible person or deployer can update institution");
    });
  });

  describe("管理机构员工", function () {
    beforeEach(async function () {
      // 添加一个机构用于测试
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );
    });

    it("机构负责人应该能够添加员工", async function () {
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      // 验证员工是否被添加
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.true;

      // 验证员工映射关系
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(1);

      // 验证员工是否添加到机构的员工列表中
      const staffList = await institutionManager.getInstitutionStaff(1);
      expect(staffList).to.include(addr2.address);
    });

    it("非机构负责人不应该能够添加员工", async function () {
      await expect(
        institutionManager.connect(addr2).addStaffToInstitution(1, addr3.address)
      ).to.be.revertedWith("Only institution responsible person can add staff");
    });

    it("机构负责人应该能够移除员工", async function () {
      // 先添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.true;

      // 移除员工
      await institutionManager.connect(addr1).removeStaffFromInstitution(1, addr2.address);

      // 验证员工是否被移除
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.false;
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(0);

      // 验证员工是否从机构的员工列表中移除
      const staffList = await institutionManager.getInstitutionStaff(1);
      expect(staffList).to.not.include(addr2.address);
    });

    it("非机构负责人不应该能够移除员工", async function () {
      // 先添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      await expect(
        institutionManager.connect(addr3).removeStaffFromInstitution(1, addr2.address)
      ).to.be.revertedWith("Only institution responsible person can remove staff");
    });

    it("不应该能够移除机构负责人", async function () {
      await expect(
        institutionManager.connect(addr1).removeStaffFromInstitution(1, addr1.address)
      ).to.be.revertedWith("Cannot remove responsible person");
    });
  });

  describe("获取机构信息", function () {
    beforeEach(async function () {
      // 添加两个机构用于测试
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );
      
      await institutionManager.addInstitution(
        "救助站B", 
        1, 
        addr2.address,
        "广州市天河区",
        "020-98765432"
      );

      // 为第一个机构添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr3.address);
    });

    it("应该能够获取所有机构信息", async function () {
      const institutions = await institutionManager.getAllInstitutions();

      expect(institutions.length).to.equal(2);
      
      expect(institutions[0].id).to.equal(1);
      expect(institutions[0].name).to.equal("宠物医院A");
      expect(institutions[0].institutionType).to.equal(0); // Hospital
      
      expect(institutions[1].id).to.equal(2);
      expect(institutions[1].name).to.equal("救助站B");
      expect(institutions[1].institutionType).to.equal(1); // Shelter
    });

    it("应该能够获取机构详细信息", async function () {
      const institutionDetail = await institutionManager.getInstitutionDetail(1);

      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
      expect(institutionDetail.orgAddress).to.equal("北京市海淀区");
      expect(institutionDetail.contactInfo).to.equal("010-12345678");
      expect(institutionDetail.staffList.length).to.equal(2); // 负责人和一个员工
      expect(institutionDetail.staffList).to.include(addr1.address);
      expect(institutionDetail.staffList).to.include(addr3.address);
    });

    it("应该能够获取机构员工列表", async function () {
      const staffList = await institutionManager.getInstitutionStaff(1);

      expect(staffList.length).to.equal(2); // 负责人和一个员工
      expect(staffList).to.include(addr1.address);
      expect(staffList).to.include(addr3.address);
    });

    it("获取不存在的机构信息应该失败", async function () {
      await expect(
        institutionManager.getInstitutionDetail(99)
      ).to.be.revertedWith("Institution does not exist");
    });

    it("应该能够按类型获取机构", async function () {
      const hospitals = await institutionManager.getInstitutionsByType(0);
      expect(hospitals.length).to.equal(1);
      expect(hospitals[0].name).to.equal("宠物医院A");
      
      const shelters = await institutionManager.getInstitutionsByType(1);
      expect(shelters.length).to.equal(1);
      expect(shelters[0].name).to.equal("救助站B");
    });

    it("应该能够获取机构创建时间", async function () {
      const creationTime = await institutionManager.getInstitutionCreationTime(1);
      expect(Number(creationTime)).to.be.a('number');
      expect(Number(creationTime)).to.be.greaterThan(0);
    });
  });

  describe("更新机构负责人", function () {
    beforeEach(async function () {
      // 添加一个机构用于测试
      await institutionManager.addInstitution(
        "宠物医院A", 
        0, 
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );
      
      // 添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);
    });

    it("机构负责人应该能够更新负责人为现有员工", async function () {
      await institutionManager.connect(addr1).updateInstitutionResponsiblePerson(1, addr2.address);
      
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.responsiblePerson).to.equal(addr2.address);
    });

    it("机构负责人应该能够更新负责人为新人员", async function () {
      await institutionManager.connect(addr1).updateInstitutionResponsiblePerson(1, addr3.address);
      
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.responsiblePerson).to.equal(addr3.address);
      
      // 验证新负责人是否被添加为员工
      expect(await institutionManager.isStaffInInstitution(1, addr3.address)).to.be.true;
      expect(await institutionManager.staffToInstitution(addr3.address)).to.equal(1);
    });

    it("部署者应该能够更新任何机构的负责人", async function () {
      await institutionManager.connect(owner).updateInstitutionResponsiblePerson(1, addr3.address);
      
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.responsiblePerson).to.equal(addr3.address);
    });

    it("非机构负责人和非部署者不应该能够更新负责人", async function () {
      await expect(
        institutionManager.connect(addr3).updateInstitutionResponsiblePerson(1, addr3.address)
      ).to.be.revertedWith("Only current responsible person or deployer can update responsible person");
    });

    it("不应该能够将已关联其他机构的人员设为负责人", async function () {
      // 创建第二个机构
      await institutionManager.addInstitution(
        "救助站B", 
        1, 
        addr3.address,
        "广州市天河区",
        "020-98765432"
      );
      
      // 尝试将第二个机构的负责人设为第一个机构的负责人
      await expect(
        institutionManager.connect(addr1).updateInstitutionResponsiblePerson(1, addr3.address)
      ).to.be.revertedWith("New responsible person is associated with another institution");
    });
  });
});

