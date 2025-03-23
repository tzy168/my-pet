const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InstitutionManager", function () {
  let institutionManager;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const InstitutionManager = await ethers.getContractFactory("InstitutionManager");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

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
      await institutionManager.addInstitution("宠物医院A", 0, addr1.address);
      
      // 验证机构ID计数器增加
      expect(await institutionManager.institutionIdCounter()).to.equal(2);
      
      // 验证机构信息
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.wallet).to.equal(addr1.address);
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
    });

    it("非部署者不应该能够添加机构", async function () {
      await expect(
        institutionManager.connect(addr1).addInstitution("宠物医院B", 0, addr2.address)
      ).to.be.revertedWith("Only deployer can add institutions");
    });

    it("不应该允许将同一地址添加为多个机构的负责人", async function () {
      await institutionManager.addInstitution("宠物医院A", 0, addr1.address);
      
      await expect(
        institutionManager.addInstitution("宠物医院B", 0, addr1.address)
      ).to.be.revertedWith("Address already associated with an institution");
    });
  });

  describe("管理机构员工", function () {
    beforeEach(async function () {
      // 添加一个机构用于测试
      await institutionManager.addInstitution("宠物医院A", 0, addr1.address);
    });

    it("机构负责人应该能够添加员工", async function () {
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);
      
      // 验证员工是否被添加
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.true;
    });

    it("非机构负责人不应该能够添加员工", async function () {
      await expect(
        institutionManager.connect(addr2).addStaffToInstitution(1, addrs[0].address)
      ).to.be.revertedWith("Only institution responsible person can add staff");
    });

    it("机构负责人应该能够移除员工", async function () {
      // 先添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.true;
      
      // 移除员工
      await institutionManager.connect(addr1).removeStaffFromInstitution(1, addr2.address);
      expect(await institutionManager.isStaffInInstitution(1, addr2.address)).to.be.false;
    });
  });

  describe("获取机构信息", function () {
    beforeEach(async function () {
      // 添加两个机构用于测试
      await institutionManager.addInstitution("宠物医院A", 0, addr1.address);
      await institutionManager.addInstitution("救助站B", 1, addr2.address);
    });

    it("应该能够获取所有机构信息", async function () {
      const institutions = await institutionManager.getAllInstitutions();
      
      // 验证返回的数组长度
      expect(institutions[0].length).to.equal(2); // ids
      expect(institutions[1].length).to.equal(2); // names
      expect(institutions[2].length).to.equal(2); // types
      expect(institutions[3].length).to.equal(2); // wallets
      
      // 验证第一个机构信息
      expect(institutions[0][0]).to.equal(1); // id
      expect(institutions[1][0]).to.equal("宠物医院A"); // name
      expect(institutions[2][0]).to.equal(0); // type (Hospital)
      expect(institutions[3][0]).to.equal(addr1.address); // wallet
      
      // 验证第二个机构信息
      expect(institutions[0][1]).to.equal(2); // id
      expect(institutions[1][1]).to.equal("救助站B"); // name
      expect(institutions[2][1]).to.equal(1); // type (Shelter)
      expect(institutions[3][1]).to.equal(addr2.address); // wallet
    });

    it("应该能够获取机构详细信息", async function () {
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      
      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.wallet).to.equal(addr1.address);
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
    });

    it("应该能够获取机构员工列表", async function () {
      // 添加员工
      await institutionManager.connect(addr1).addStaffToInstitution(1, addrs[0].address);
      await institutionManager.connect(addr1).addStaffToInstitution(1, addrs[1].address);
      
      const staff = await institutionManager.getInstitutionStaff(1);
      
      // 检查员工是否被正确添加到机构
      expect(await institutionManager.isStaffInInstitution(1, addrs[0].address)).to.be.true;
      expect(await institutionManager.isStaffInInstitution(1, addrs[1].address)).to.be.true;
    });
  });
});