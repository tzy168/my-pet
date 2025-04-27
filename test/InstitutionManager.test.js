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
        0, // Hospital
        addr1.address,
        "北京市海淀区",
        "010-12345678"
      );

      // 添加救助站类型机构
      await institutionManager.addInstitution(
        "救助站B",
        1, // Shelter
        addr2.address,
        "上海市浦东新区",
        "021-87654321"
      );

      // 验证机构类型
      const hospital = await institutionManager.getInstitutionDetail(1);
      const shelter = await institutionManager.getInstitutionDetail(2);
      expect(hospital.institutionType).to.equal(0); // Hospital
      expect(shelter.institutionType).to.equal(1); // Shelter
    });
  });

  describe("更新机构信息", function () {
    beforeEach(async function () {
      // 添加一个测试机构
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
        "宠物医院A新名称",
        "北京市朝阳区",
        "010-87654321"
      );

      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A新名称");
      expect(institutionDetail.orgAddress).to.equal("北京市朝阳区");
      expect(institutionDetail.contactInfo).to.equal("010-87654321");
    });

    it("部署者应该能够更新任何机构信息", async function () {
      await institutionManager.updateInstitution(
        1,
        "宠物医院A新名称2",
        "北京市西城区",
        "010-11112222"
      );

      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A新名称2");
      expect(institutionDetail.orgAddress).to.equal("北京市西城区");
      expect(institutionDetail.contactInfo).to.equal("010-11112222");
    });

    it("非机构负责人和非部署者不应该能够更新机构信息", async function () {
      await expect(
        institutionManager.connect(addr2).updateInstitution(
          1,
          "宠物医院A新名称3",
          "北京市海淀区",
          "010-33334444"
        )
      ).to.be.revertedWith("Only responsible person or deployer can update institution");
    });

    it("不应该能够更新不存在的机构", async function () {
      await expect(
        institutionManager.updateInstitution(
          999,
          "不存在的机构",
          "不存在的地址",
          "不存在的联系方式"
        )
      ).to.be.revertedWith("Institution does not exist");
    });
  });

  describe("员工管理", function () {
    beforeEach(async function () {
      // 添加一个测试机构
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

      // 验证员工是否被添加到机构
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.true;
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(1);

      // 验证员工列表
      const staffList = await institutionManager.getInstitutionStaff(1);
      expect(staffList.length).to.equal(2); // 负责人 + 新员工
      expect(staffList[1]).to.equal(addr2.address);
    });

    it("非机构负责人不应该能够添加员工", async function () {
      await expect(
        institutionManager.connect(addr2).addStaffToInstitution(1, addr3.address)
      ).to.be.revertedWith("Only institution responsible person can add staff");
    });

    it("不应该能够将已关联机构的地址添加为员工", async function () {
      // 添加另一个机构
      await institutionManager.addInstitution(
        "宠物医院B",
        0,
        addr3.address,
        "上海市浦东新区",
        "021-87654321"
      );

      // 尝试将addr3添加为机构1的员工
      await expect(
        institutionManager.connect(addr1).addStaffToInstitution(1, addr3.address)
      ).to.be.revertedWith("Staff already associated with an institution");
    });

    it("机构负责人应该能够移除员工", async function () {
      // 先添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      // 移除员工
      await institutionManager.connect(addr1).removeStaffFromInstitution(1, addr2.address);

      // 验证员工是否被移除
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.false;
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(0);

      // 验证员工列表
      const staffList = await institutionManager.getInstitutionStaff(1);
      expect(staffList.length).to.equal(1); // 只剩下负责人
      expect(staffList[0]).to.equal(addr1.address);
    });

    it("非机构负责人不应该能够移除员工", async function () {
      // 先添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      // 尝试用非负责人移除员工
      await expect(
        institutionManager.connect(addr2).removeStaffFromInstitution(1, addr2.address)
      ).to.be.revertedWith("Only institution responsible person can remove staff");
    });

    it("不应该能够移除机构负责人", async function () {
      await expect(
        institutionManager.connect(addr1).removeStaffFromInstitution(1, addr1.address)
      ).to.be.revertedWith("Cannot remove responsible person");
    });
  });

  describe("查询功能", function () {
    beforeEach(async function () {
      // 添加两个测试机构
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
        "上海市浦东新区",
        "021-87654321"
      );
    });

    it("应该能够获取所有机构信息", async function () {
      const institutions = await institutionManager.getAllInstitutions();
      expect(institutions.length).to.equal(2);
      expect(institutions[0].name).to.equal("宠物医院A");
      expect(institutions[1].name).to.equal("救助站B");
    });

    it("应该能够获取机构详细信息", async function () {
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
    });

    it("应该能够获取机构员工列表", async function () {
      // 添加员工到第一个机构
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr3.address);

      const staffList = await institutionManager.getInstitutionStaff(1);
      expect(staffList.length).to.equal(2);
      expect(staffList[0]).to.equal(addr1.address); // 负责人
      expect(staffList[1]).to.equal(addr3.address); // 新员工
    });

    it("应该能够检查员工是否属于机构", async function () {
      expect(await institutionManager.isStaffInInstitution(1, addr1.address)).to.be.true; // 负责人
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.false; // 非员工
      expect(await institutionManager.isStaffInInstitution(2, addr2.address)).to.be.true; // 另一个机构的负责人
    });

    it("查询不存在的机构应该失败", async function () {
      await expect(
        institutionManager.getInstitutionDetail(999)
      ).to.be.revertedWith("Institution does not exist");

      await expect(
        institutionManager.getInstitutionStaff(999)
      ).to.be.revertedWith("Institution does not exist");
    });
  });

  describe("删除机构", function () {
    beforeEach(async function () {
      // 添加一个测试机构
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

    it("部署者应该能够删除机构", async function () {
      await institutionManager.deleteInstitution(1);

      // 验证机构是否被删除（ID仍存在但内容被清空）
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("");
      expect(institutionDetail.responsiblePerson).to.equal("0x0000000000000000000000000000000000000000");

      // 验证员工关联是否被清除
      expect(await institutionManager.staffToInstitution(addr1.address)).to.equal(0);
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(0);
    });

    it("非部署者不应该能够删除机构", async function () {
      await expect(
        institutionManager.connect(addr1).deleteInstitution(1)
      ).to.be.revertedWith("Only deployer can delete institution");
    });

    it("不应该能够删除不存在的机构", async function () {
      await expect(
        institutionManager.deleteInstitution(999)
      ).to.be.revertedWith("Institution does not exist");
    });
  });
});

