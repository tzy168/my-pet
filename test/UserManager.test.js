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

    // 添加一个测试医院机构
    await institutionManager.addInstitution(
      "测试医院",
      0, // Hospital类型
      addr3.address,
      "北京市海淀区",
      "010-12345678"
    );
  });

  describe("部署", function () {
    it("应该正确设置InstitutionManager地址", async function () {
      expect(await userManager.institutionManagerAddress()).to.equal(
        await institutionManager.getAddress()
      );
    });

    it("应该正确设置部署者地址", async function () {
      expect(await userManager.deployer()).to.equal(owner.address);
    });

    it("用户ID计数器应该初始化为1", async function () {
      expect(await userManager.userIdCounter()).to.equal(1);
    });
  });

  describe("用户资料设置", function () {
    it("个人用户应该能够设置资料", async function () {
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0,  // 个人用户不关联机构
        "ipfs://QmXXX" // 头像URL
      );

      // 验证用户ID计数器增加
      expect(await userManager.userIdCounter()).to.equal(2);

      // 验证用户信息
      const userInfo = await userManager.getUserInfo(addr1.address);
      expect(userInfo.id).to.equal(1);
      expect(userInfo.name).to.equal("张三");
      expect(userInfo.email).to.equal("zhangsan@example.com");
      expect(userInfo.phone).to.equal("13800138000");
      expect(userInfo.wallet).to.equal(addr1.address);
      expect(userInfo.userType).to.equal(0); // Personal
      expect(userInfo.orgId).to.equal(0);
      expect(userInfo.roleId).to.equal(1); // User role
      expect(userInfo.avatar).to.equal("ipfs://QmXXX");
    });

    it("机构用户应该能够设置资料并关联机构", async function () {
      const orgId = 1; // 测试机构的ID
      // 先将addr2添加为机构员工 - 必须由负责人(addr3)添加
      await institutionManager.connect(addr3).addStaffToInstitution(orgId, addr2.address);
      await userManager.connect(addr2).setUserProfile(
        "李四",
        "lisi@example.com",
        "13900139000",
        1, // Institutional
        orgId,  // 使用正确的机构ID
        "ipfs://QmYYY" // 头像URL
      );

      // 验证用户信息
      const userInfo = await userManager.getUserInfo(addr2.address);
      expect(userInfo.id).to.equal(1);
      expect(userInfo.name).to.equal("李四");
      expect(userInfo.userType).to.equal(1); // Institutional
      expect(userInfo.orgId).to.equal(orgId);
      expect(userInfo.orgName).to.equal("测试医院"); // 机构名称应该匹配
      expect(userInfo.orgType).to.equal(0); // Hospital
      expect(userInfo.avatar).to.equal("ipfs://QmYYY");
    });

    it("医院机构用户应该被设置为医院角色", async function () {
      // 设置为机构用户 - 注意：addr3是机构负责人，已经自动关联到机构，不需要再次添加
      await userManager.connect(addr3).setUserProfile(
        "医院负责人",
        "hospital@example.com",
        "13600000000",
        1, // Institutional
        1,  // 关联医院机构
        "ipfs://QmZZZ" // 头像URL
      );

      const userInfo = await userManager.getUserInfo(addr3.address);
      expect(userInfo.roleId).to.equal(2); // Hospital role
    });

    it("部署者应该被设置为管理员角色", async function () {
      await userManager.connect(owner).setUserProfile(
        "管理员",
        "admin@example.com",
        "13700000000",
        0, // Personal
        0,  // 个人用户不关联机构
        "ipfs://QmAAA" // 头像URL
      );

      const userInfo = await userManager.getUserInfo(owner.address);
      expect(userInfo.roleId).to.equal(0); // Admin role
    });

    it("个人用户不应该关联机构ID", async function () {
      await expect(
        userManager.connect(addr1).setUserProfile(
          "张三",
          "zhangsan@example.com",
          "13800138000",
          0, // Personal
          1,  // 尝试关联机构ID
          "ipfs://QmXXX" // 头像URL
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
          0,  // 未关联机构ID
          "ipfs://QmYYY" // 头像URL
        )
      ).to.be.revertedWith("Institutional user must associate with an institution");

      await expect(
        userManager.connect(addr2).setUserProfile(
          "李四",
          "lisi@example.com",
          "13900139000",
          1, // Institutional
          99, // 不存在的机构ID
          "ipfs://QmYYY" // 头像URL
        )
      ).to.be.revertedWith("Associated institution does not exist");
    });


    // it("机构用户必须是该机构的员工", async function () {
    //   await institutionManager.connect(addr3).addStaffToInstitution(1, addr2.address);
    //   // addr2不是机构1的员工
    //   await expect(
    //     userManager.connect(addr2).setUserProfile(
    //       "李四",
    //       "lisi@example.com",
    //       "13900139000",
    //       1, // Institutional
    //       1, // 机构ID
    //       "ipfs://QmYYY" // 头像URL
    //     )
    //   ).to.be.revertedWith("User is not a staff member of the specified institution");
    // });

    it("用户应该能够更新资料", async function () {
      // 先设置初始资料
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0, // 个人用户不关联机构
        "ipfs://QmXXX" // 头像URL
      );

      // 更新资料
      await userManager.connect(addr1).setUserProfile(
        "张三更新",
        "zhangsan_new@example.com",
        "13800138001",
        0, // Personal
        0, // 个人用户不关联机构
        "ipfs://QmXXX_new" // 更新头像URL
      );

      // 验证更新后的信息
      const userInfo = await userManager.getUserInfo(addr1.address);
      expect(userInfo.id).to.equal(1); // ID不变
      expect(userInfo.name).to.equal("张三更新");
      expect(userInfo.email).to.equal("zhangsan_new@example.com");
      expect(userInfo.phone).to.equal("13800138001");
      expect(userInfo.avatar).to.equal("ipfs://QmXXX_new");
    });
  });

  describe("用户角色管理", function () {
    beforeEach(async function () {
      // 注册一个普通用户
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0, // 个人用户不关联机构
        "ipfs://QmXXX" // 头像URL
      );
    });

    it("部署者应该能够更新用户角色", async function () {
      await userManager.connect(owner).updateUserRole(addr1.address, 3); // 设置为救助站角色

      const userInfo = await userManager.getUserInfo(addr1.address);
      expect(userInfo.roleId).to.equal(3); // Shelter role
    });

    it("非部署者不应该能够更新用户角色", async function () {
      await expect(
        userManager.connect(addr2).updateUserRole(addr1.address, 3)
      ).to.be.revertedWith("Only deployer can update user roles");
    });
  });

  describe("宠物管理", function () {
    beforeEach(async function () {
      // 注册一个普通用户
      await userManager.connect(addr1).setUserProfile(
        "张三",
        "zhangsan@example.com",
        "13800138000",
        0, // Personal
        0, // 个人用户不关联机构
        "ipfs://QmXXX" // 头像URL
      );
    });

    // it("应该能够添加宠物到用户", async function () {
    //   await userManager.addPetToUser(addr1.address, 1);
    //   const petIds = await userManager.getUserPetIds(addr1.address);
    //   expect(petIds).to.include(1);
    // });

    it("应该能够从用户移除宠物", async function () {
      await userManager.addPetToUser(addr1.address, 1);
      await userManager.removePetFromUser(addr1.address, 1);

      const petIds = await userManager.getUserPetIds(addr1.address);
      expect(petIds).to.not.include(1);
    });
  });
});