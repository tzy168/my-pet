const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PetManager", function () {
  let institutionManager;
  let userManager;
  let petManager;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const InstitutionManager = await ethers.getContractFactory("InstitutionManager");
    const UserManager = await ethers.getContractFactory("UserManager");
    const PetManager = await ethers.getContractFactory("PetManager");
    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();

    // 部署InstitutionManager合约
    institutionManager = await InstitutionManager.deploy();
    await institutionManager.waitForDeployment();

    // 部署UserManager合约，传入InstitutionManager地址
    userManager = await UserManager.deploy(await institutionManager.getAddress());
    await userManager.waitForDeployment();

    // 部署PetManager合约，传入UserManager和InstitutionManager地址
    petManager = await PetManager.deploy(
      await userManager.getAddress(),
      await institutionManager.getAddress()
    );
    await petManager.waitForDeployment();

    // 添加一个测试机构
    await institutionManager.addInstitution("测试医院", 0, addr3.address);

    // 注册用户
    await userManager.connect(addr1).setUserProfile(
      "张三",
      "zhangsan@example.com",
      "13800138000",
      0, // Personal
      0  // 个人用户不关联机构
    );

    await userManager.connect(addr2).setUserProfile(
      "李四",
      "lisi@example.com",
      "13900139000",
      1, // Institutional
      1  // 关联机构ID为1
    );
  });

  describe("部署", function () {
    it("应该正确设置UserManager地址", async function () {
      expect(await petManager.userManagerAddress()).to.equal(
        await userManager.getAddress()
      );
    });

    it("初始宠物ID计数器应该为1", async function () {
      expect(await petManager.petIdCounter()).to.equal(1);
    });
  });

  describe("宠物管理", function () {
    it("用户应该能够添加宠物", async function () {
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );

      // 验证宠物ID计数器增加
      expect(await petManager.petIdCounter()).to.equal(2);

      // 获取用户的宠物列表
      const pets = await petManager.getUserPets(addr1.address);
      expect(pets.length).to.equal(1);
      expect(pets[0].name).to.equal("小白");
      expect(pets[0].species).to.equal("猫");
      expect(pets[0].breed).to.equal("英短");
      expect(pets[0].gender).to.equal("雄性");
      expect(pets[0].age).to.equal(2);
      expect(pets[0].description).to.equal("一只可爱的小猫");
      expect(pets[0].image).to.equal("ipfs://QmXXX");
      expect(pets[0].status).to.equal("active");
      expect(pets[0].owner).to.equal(addr1.address);
    });

    it("用户应该能够更新自己的宠物信息", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );

      // 更新宠物信息
      await petManager.connect(addr1).updatePet(
        1,
        "小白白",
        "猫",
        "英短",
        "雄性",
        3,
        "一只非常可爱的小猫",
        "ipfs://QmYYY"
      );

      // 验证更新后的信息
      const pets = await petManager.getUserPets(addr1.address);
      expect(pets.length).to.equal(1);
      expect(pets[0].name).to.equal("小白白");
      expect(pets[0].age).to.equal(3);
      expect(pets[0].description).to.equal("一只非常可爱的小猫");
      expect(pets[0].image).to.equal("ipfs://QmYYY");
    });

    it("用户不应该能够更新其他用户的宠物信息", async function () {
      // 用户1添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );

      // 用户2尝试更新用户1的宠物信息
      await expect(
        petManager.connect(addr2).updatePet(
          1,
          "小黑",
          "猫",
          "英短",
          "雄性",
          3,
          "一只黑猫",
          "ipfs://QmZZZ"
        )
      ).to.be.revertedWith("Not the pet owner");
    });

    it("用户应该能够删除自己的宠物", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );

      // 删除宠物
      await petManager.connect(addr1).removePet(1);

      // 验证宠物列表为空
      const pets = await petManager.getUserPets(addr1.address);
      expect(pets.length).to.equal(0);
    });

    it("用户不应该能够删除其他用户的宠物", async function () {
      // 用户1添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );

      // 用户2尝试删除用户1的宠物
      await expect(
        petManager.connect(addr2).removePet(1)
      ).to.be.revertedWith("Not the pet owner");
    });
  });

  describe("宠物事件管理", function () {
    beforeEach(async function () {
      // 用户1添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "猫",
        "英短",
        "雄性",
        2,
        "一只可爱的小猫",
        "ipfs://QmXXX"
      );
    });

    it("应该能够添加领养事件", async function () {
      await petManager.connect(addr1).addAdoptionEvent(
        1,
        addr2.address,
        "从救助站领养"
      );

      // 验证领养事件
      const event = await petManager.adoptionEvents(0);
      expect(event.petId).to.equal(1);
      expect(event.adopter).to.equal(addr2.address);
      expect(event.notes).to.equal("从救助站领养");
    });

    it("应该能够添加医疗事件", async function () {
      await petManager.connect(addr3).addMedicalEvent(
        1,
        "健康检查",
        "疫苗接种",
        // addr3.address,
        // addr3.address
      );

      // 验证医疗事件
      const event = await petManager.medicalEvents(0);
      expect(event.petId).to.equal(1);
      expect(event.diagnosis).to.equal("健康检查");
      expect(event.treatment).to.equal("疫苗接种");
      expect(event.hospital).to.equal(addr3.address);
      expect(event.doctor).to.equal(addr3.address);
    });

    it("应该能够添加救助请求", async function () {
      const tx = await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区",
        "发现一只受伤的流浪猫"
      );

      // 验证救助请求ID
      expect(await petManager.rescueRequestIdCounter()).to.equal(2);

      // 验证救助请求
      const request = await petManager.rescueRequests(0);
      expect(request.id).to.equal(1);
      expect(request.location).to.equal("北京市海淀区");
      expect(request.description).to.equal("发现一只受伤的流浪猫");
      expect(request.status).to.equal("pending");
      expect(request.responderOrgId).to.equal(0);
    });

    it("应该能够更新救助请求状态", async function () {
      // 添加救助请求
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区",
        "发现一只受伤的流浪猫"
      );

      // 更新救助请求状态
      await petManager.connect(addr2).updateRescueRequestStatus(
        1,
        "processing",
        1
      );

      // 验证更新后的状态
      const request = await petManager.rescueRequests(0);
      expect(request.status).to.equal("processing");
      expect(request.responderOrgId).to.equal(1);
    });
  });
});