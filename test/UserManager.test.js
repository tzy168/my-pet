const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserManager", function () {
  let institutionManager;
  let userManager;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const InstitutionManager = await ethers.getContractFactory("InstitutionManager");
    const UserManager = await ethers.getContractFactory("UserManager");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // 部署InstitutionManager合约
    institutionManager = await InstitutionManager.deploy();
    await institutionManager.waitForDeployment();

    // 部署UserManager合约，传入InstitutionManager地址
    userManager = await UserManager.deploy(await institutionManager.getAddress());
    await userManager.waitForDeployment();

    // 添加一个测试机构
    await institutionManager.addInstitution("测试医院", 0, addr3.address);
    
    // 先注册一个用户，增加userIdCounter的值，使其大于机构ID
    await userManager.connect(addrs[0]).setUserProfile(
      "测试用户",
      "test@example.com",
      "13700000000",
      0, // Personal
      0  // 个人用户不关联机构
    );
  });

  describe("部署", function () {
    it("应该正确设置InstitutionManager地址", async function () {
      expect(await userManager.institutionManagerAddress()).to.equal(
        await institutionManager.getAddress()
      );
    });

    it("用户ID计数器应该在初始化后增加", async function () {
      // 由于在beforeEach中已经注册了一个用户，所以计数器应该为2
      expect(await userManager.userIdCounter()).to.equal(2);
    });
  });

  describe("用户资料设置", function () {
    it("个人用户应该能够设置资料", async function () {
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0  // 个人用户不关联机构
      );

      // 验证用户ID计数器增加
      expect(await userManager.userIdCounter()).to.equal(3);

      // 验证用户信息
      const userInfo = await userManager.getUserInfo(addr1.address);
      expect(userInfo.id).to.equal(2);
      expect(userInfo.name).to.equal("张三");
      expect(userInfo.email).to.equal("zhangsan@example.com");
      expect(userInfo.phone).to.equal("13800138000");
      expect(userInfo.wallet).to.equal(addr1.address);
      expect(userInfo.userType).to.equal(0); // Personal
      expect(userInfo.orgId).to.equal(0);
    });


    it("机构用户应该能够设置资料并关联机构", async function () {
      // 在UserManager合约中，检查机构ID是否存在的逻辑是 _orgId < userIdCounter
      // 因此我们需要确保机构ID小于当前的userIdCounter
      // 由于我们已经注册了一个测试机构，其ID应该为1
      const orgId = 1; // 测试机构的ID
      
      await userManager.connect(addr2).setUserProfile(
        "李四",
        "lisi@example.com",
        "13900139000",
        1, // Institutional
        orgId  // 使用正确的机构ID
      );

      // 验证用户信息
      const userInfo = await userManager.getUserInfo(addr2.address);
      expect(userInfo.id).to.equal(2);
      expect(userInfo.name).to.equal("李四");
      expect(userInfo.userType).to.equal(1); // Institutional
      expect(userInfo.orgId).to.equal(orgId);
    });


    it("个人用户不应该关联机构ID", async function () {
      await expect(
        userManager.connect(addr1).setUserProfile(
          "张三",
          "zhangsan@example.com",
          "13800138000",
          0, // Personal
          1  // 尝试关联机构ID
        )
      ).to.be.revertedWith("Personal user should not associate with an institution");
    });

    it("机构用户必须关联有效的机构ID", async function () {
      await expect(
        userManager.connect(addr2).setUserProfile(
          "李四",
          "lisi@example.com",
          "13900139000",
          1, // Institutional
          0  // 未关联机构ID
        )
      ).to.be.revertedWith("Institutional user must associate with an institution");

      await expect(
        userManager.connect(addr2).setUserProfile(
          "李四",
          "lisi@example.com",
          "13900139000",
          1, // Institutional
          99 // 不存在的机构ID
        )
      ).to.be.revertedWith("Associated institution does not exist");
    });

    it("用户应该能够更新资料", async function () {
      // 先设置初始资料
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0
      );

      // 更新资料
      await userManager.connect(addr1).setUserProfile(
        "张三更新",
        "zhangsan_new@example.com",
        "13800138001",
        0, // Personal
        0
      );

      // 验证更新后的信息
      const userInfo = await userManager.getUserInfo(addr1.address);
      expect(userInfo.id).to.equal(2); // ID不变
      expect(userInfo.name).to.equal("张三更新");
      expect(userInfo.email).to.equal("zhangsan_new@example.com");
      expect(userInfo.phone).to.equal("13800138001");
    });
  });

  describe("用户注册检查", function () {
    it("应该正确检查用户是否已注册", async function () {
      // 初始状态下用户未注册
      expect(await userManager.checkUserIsRegistered(addr1.address)).to.be.false;

      // 设置用户资料后，用户应该被标记为已注册
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0,
        0
      );

      expect(await userManager.checkUserIsRegistered(addr1.address)).to.be.true;
    });

    it("未注册用户不应该能够获取用户信息", async function () {
      await expect(
        userManager.getUserInfo(addr2.address)
      ).to.be.revertedWith("User not registered");
    });
  });
});