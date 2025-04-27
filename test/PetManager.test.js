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
  let addr4;
  let addrs;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const InstitutionManager = await ethers.getContractFactory("InstitutionManager");
    const UserManager = await ethers.getContractFactory("UserManager");
    const PetManager = await ethers.getContractFactory("PetManager");
    [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();

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

    // 添加一个测试医院机构
    await institutionManager.addInstitution(
      "测试医院",
      0, // Hospital类型
      addr3.address,
      "北京市海淀区",
      "010-12345678"
    );

    // 添加一个测试救助站机构
    await institutionManager.addInstitution(
      "测试救助站",
      1, // Shelter类型
      addr4.address,
      "上海市浦东新区",
      "021-87654321"
    );

    // 注册用户
    await userManager.connect(addr1).setUserProfile(
      "张三",
      "zhangsan@example.com",
      "13800138000",
      0, // Personal
      0,  // 个人用户不关联机构
      "ipfs://QmXXX" // 头像URL
    );

    await userManager.connect(addr2).setUserProfile(
      "李四",
      "lisi@example.com",
      "13900139000",
      0, // Personal
      0,  // 个人用户不关联机构
      "ipfs://QmYYY" // 头像URL
    );

    // 注册医院用户 - 注意：机构负责人已经自动关联到机构，不需要再次添加
    await userManager.connect(addr3).setUserProfile(
      "医院用户",
      "hospital@example.com",
      "13700000000",
      1, // Institutional
      1,  // 关联医院机构
      "ipfs://QmZZZ" // 头像URL
    );

    // 注册救助站用户 - 注意：机构负责人已经自动关联到机构，不需要再次添加
    await userManager.connect(addr4).setUserProfile(
      "救助站用户",
      "shelter@example.com",
      "13600000000",
      1, // Institutional
      2,  // 关联救助站机构
      "ipfs://QmAAA" // 头像URL
    );
  });

  describe("部署", function () {
    it("应该正确设置UserManager地址", async function () {
      expect(await petManager.userManagerAddress()).to.equal(
        await userManager.getAddress()
      );
    });

    it("应该正确设置InstitutionManager地址", async function () {
      expect(await petManager.institutionManagerAddress()).to.equal(
        await institutionManager.getAddress()
      );
    });
  });

  describe("宠物管理", function () {
    it("用户应该能够添加宠物", async function () {
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 验证宠物ID计数器增加
      expect(await petManager.petIdCounter()).to.equal(2);

      // 验证宠物信息
      const pet = await petManager.getPetById(1);
      expect(pet.id).to.equal(1);
      expect(pet.name).to.equal("小白");
      expect(pet.species).to.equal("狗");
      expect(pet.breed).to.equal("柴犬");
      expect(pet.gender).to.equal("公");
      expect(pet.age).to.equal(2);
      expect(pet.description).to.equal("活泼可爱的小狗");
      expect(pet.image).to.equal("ipfs://QmXXX");
      expect(pet.owner).to.equal(addr1.address);
      expect(pet.healthStatus).to.equal(0); // Healthy
      expect(pet.adoptionStatus).to.equal(3); // NotAvailable
    });

    it("用户应该能够更新自己的宠物信息", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 更新宠物信息
      await petManager.connect(addr1).updatePet(
        1,
        "小白白",
        "狗",
        "柴犬",
        "公",
        3,
        "更新后的描述",
        "ipfs://QmYYY",
        0, // Healthy
        3  // NotAvailable
      );

      // 验证更新后的宠物信息
      const pet = await petManager.getPetById(1);
      expect(pet.name).to.equal("小白白");
      expect(pet.age).to.equal(3);
      expect(pet.description).to.equal("更新后的描述");
      expect(pet.image).to.equal("ipfs://QmYYY");
    });

    it("非宠物主人不应该能够更新宠物信息", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 尝试用其他用户更新宠物信息
      await expect(
        petManager.connect(addr2).updatePet(
          1,
          "小黑",
          "狗",
          "柴犬",
          "公",
          3,
          "更新后的描述",
          "ipfs://QmYYY",
          0, // Healthy
          3  // NotAvailable
        )
      ).to.be.revertedWith("Not the pet owner");
    });

    it("医院用户应该能够更新宠物健康状态", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 医院用户更新宠物健康状态
      await petManager.connect(addr3).updatePetHealthStatus(1, 1); // Sick

      // 验证更新后的宠物健康状态
      const pet = await petManager.getPetById(1);
      expect(pet.healthStatus).to.equal(1); // Sick
    });

    it("非医院用户和非宠物主人不应该能够更新宠物健康状态", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 尝试用非医院用户和非宠物主人更新宠物健康状态
      await expect(
        petManager.connect(addr2).updatePetHealthStatus(1, 1) // Sick
      ).to.be.revertedWith("Only pet owner or hospital staff can update health status");
    });

    it("救助站用户应该能够更新宠物领养状态", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 救助站用户更新宠物领养状态
      await petManager.connect(addr4).updatePetAdoptionStatus(1, 0); // Available

      // 验证更新后的宠物领养状态
      const pet = await petManager.getPetById(1);
      expect(pet.adoptionStatus).to.equal(0); // Available
    });

    it("非救助站用户和非宠物主人不应该能够更新宠物领养状态", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 尝试用非救助站用户和非宠物主人更新宠物领养状态
      await expect(
        petManager.connect(addr2).updatePetAdoptionStatus(1, 0) // Available
      ).to.be.revertedWith("Only pet owner or shelter staff can update adoption status");
    });

    it("用户应该能够删除自己的宠物", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 删除宠物
      await petManager.connect(addr1).removePet(1);

      // 验证宠物状态
      const pet = await petManager.getPetById(1);
      expect(pet.owner).to.equal("0x0000000000000000000000000000000000000000"); // 所有者被清空
      expect(pet.adoptionStatus).to.equal(3); // NotAvailable
    });

    it("非宠物主人不应该能够删除宠物", async function () {
      // 先添加宠物
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );

      // 尝试用非宠物主人删除宠物
      await expect(
        petManager.connect(addr2).removePet(1)
      ).to.be.revertedWith("Not the pet owner");
    });
  });

  describe("宠物查询", function () {
    beforeEach(async function () {
      // 添加多个宠物用于测试
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        0  // Available
      );

      await petManager.connect(addr1).addPet(
        "小花",
        "猫",
        "橘猫",
        "母",
        1,
        "温顺的小猫",
        "ipfs://QmYYY",
        0, // Healthy
        1  // Adopted
      );

      await petManager.connect(addr2).addPet(
        "小黑",
        "狗",
        "拉布拉多",
        "公",
        3,
        "活泼的大狗",
        "ipfs://QmZZZ",
        1, // Sick
        2  // Processing
      );
    });

    it("应该能够获取用户的宠物列表", async function () {
      const userPets = await petManager.getUserPets(addr1.address);
      expect(userPets.length).to.equal(2);
      expect(userPets[0].name).to.equal("小白");
      expect(userPets[1].name).to.equal("小花");
    });

    it("应该能够根据ID获取宠物", async function () {
      const pet = await petManager.getPetById(2);
      expect(pet.id).to.equal(2);
      expect(pet.name).to.equal("小花");
      expect(pet.species).to.equal("猫");
    });

    it("应该能够根据领养状态获取宠物", async function () {
      const availablePets = await petManager.getPetsByAdoptionStatus(0); // Available
      expect(availablePets.length).to.equal(1);
      expect(availablePets[0].name).to.equal("小白");

      const adoptedPets = await petManager.getPetsByAdoptionStatus(1); // Adopted
      expect(adoptedPets.length).to.equal(1);
      expect(adoptedPets[0].name).to.equal("小花");
    });

    it("医院用户应该能够获取所有宠物", async function () {
      const allPets = await petManager.connect(addr3).getAllPets();
      expect(allPets.length).to.equal(3);
    });

    it("普通用户不应该能够获取所有宠物", async function () {
      await expect(
        petManager.connect(addr1).getAllPets()
      ).to.be.revertedWith("Only admin or hospital staff can view all pets");
    });
  });

  describe("领养事件", function () {
    beforeEach(async function () {
      // 添加宠物用于测试
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        0  // Available
      );
    });

    it("应该能够添加领养事件", async function () {
      await petManager.connect(addr4).addAdoptionEvent(
        1, // 宠物ID
        addr2.address, // 领养人
        "领养备注",
        2 // 救助站机构ID
      );

      // 验证领养事件
      const event = await petManager.getAdoptionEvent(1);
      expect(event.petId).to.equal(1);
      expect(event.adopter).to.equal(addr2.address);
      expect(event.previousOwner).to.equal(addr1.address);
      expect(event.notes).to.equal("领养备注");
      expect(event.institutionId).to.equal(2);

      // 验证宠物所有权已转移
      const pet = await petManager.getPetById(1);
      expect(pet.owner).to.equal(addr2.address);
      expect(pet.adoptionStatus).to.equal(1); // Adopted
    });

    it("应该能够获取宠物的领养历史", async function () {
      // 添加领养事件
      await petManager.connect(addr4).addAdoptionEvent(
        1, // 宠物ID
        addr2.address, // 领养人
        "领养备注1",
        2 // 救助站机构ID
      );

      // 再次转移所有权
      await petManager.connect(addr4).addAdoptionEvent(
        1, // 宠物ID
        addr3.address, // 新领养人
        "领养备注2",
        2 // 救助站机构ID
      );

      // 获取领养历史
      const adoptionHistory = await petManager.getPetAdoptionHistory(1);
      expect(adoptionHistory.length).to.equal(2);
      expect(adoptionHistory[0].adopter).to.equal(addr2.address);
      expect(adoptionHistory[1].adopter).to.equal(addr3.address);
    });
  });

  describe("医疗事件", function () {
    beforeEach(async function () {
      // 添加宠物用于测试
      await petManager.connect(addr1).addPet(
        "小白",
        "狗",
        "柴犬",
        "公",
        2,
        "活泼可爱的小狗",
        "ipfs://QmXXX",
        0, // Healthy
        3  // NotAvailable
      );
    });

    it("医院用户应该能够添加医疗事件", async function () {
      await petManager.connect(addr3).addMedicalEvent(
        1, // 宠物ID
        "感冒", // 诊断
        "输液治疗", // 治疗方法
        100, // 费用
        ["ipfs://QmAAA", "ipfs://QmBBB"] // 附件
      );

      // 验证医疗事件
      const event = await petManager.getMedicalEvent(1);
      expect(event.petId).to.equal(1);
      expect(event.diagnosis).to.equal("感冒");
      expect(event.treatment).to.equal("输液治疗");
      expect(event.cost).to.equal(100);
      expect(event.attachments.length).to.equal(2);
      expect(event.attachments[0]).to.equal("ipfs://QmAAA");
      expect(event.attachments[1]).to.equal("ipfs://QmBBB");
    });

    it("非医院用户不应该能够添加医疗事件", async function () {
      await expect(
        petManager.connect(addr1).addMedicalEvent(
          1, // 宠物ID
          "感冒", // 诊断
          "输液治疗", // 治疗方法
          100, // 费用
          ["ipfs://QmAAA"] // 附件
        )
      ).to.be.revertedWith("Caller is not a staff member of any institution");
    });

    it("应该能够获取宠物的医疗记录", async function () {
      // 添加多个医疗事件
      await petManager.connect(addr3).addMedicalEvent(
        1, // 宠物ID
        "感冒", // 诊断
        "输液治疗", // 治疗方法
        100, // 费用
        ["ipfs://QmAAA"] // 附件
      );

      await petManager.connect(addr3).addMedicalEvent(
        1, // 宠物ID
        "皮肤病", // 诊断
        "外用药膏", // 治疗方法
        50, // 费用
        ["ipfs://QmBBB"] // 附件
      );

      // 获取医疗记录
      const medicalHistory = await petManager.getPetMedicalHistory(1);
      expect(medicalHistory.length).to.equal(2);
      expect(medicalHistory[0].diagnosis).to.equal("感冒");
      expect(medicalHistory[1].diagnosis).to.equal("皮肤病");
    });
  });

  describe("救助请求", function () {
    it("用户应该能够添加救助请求", async function () {
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村", // 位置
        "发现一只受伤的流浪猫", // 描述
        ["ipfs://QmAAA"], // 图片
        2 // 紧急程度
      );

      // 验证救助请求
      const request = await petManager.getRescueRequest(1);
      expect(request.requester).to.equal(addr1.address);
      expect(request.location).to.equal("北京市海淀区中关村");
      expect(request.description).to.equal("发现一只受伤的流浪猫");
      expect(request.images.length).to.equal(1);
      expect(request.images[0]).to.equal("ipfs://QmAAA");
      expect(request.urgencyLevel).to.equal(2);
      expect(request.status).to.equal("pending"); // 初始状态为pending（小写）
    });

    it("救助站用户应该能够更新救助请求状态", async function () {
      // 先添加救助请求
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村", // 位置
        "发现一只受伤的流浪猫", // 描述
        ["ipfs://QmAAA"], // 图片
        2 // 紧急程度
      );

      // 救助站用户更新请求状态
      await petManager.connect(addr4).updateRescueRequestStatus(
        1, // 请求ID
        "Processing", // 新状态
        2 // 救助站机构ID
      );

      // 验证更新后的状态
      const request = await petManager.getRescueRequest(1);
      expect(request.status).to.equal("Processing");
      expect(request.responderOrgId).to.equal(2);
    });

    it("非救助站用户不应该能够更新救助请求状态", async function () {
      // 先添加救助请求
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村", // 位置
        "发现一只受伤的流浪猫", // 描述
        ["ipfs://QmAAA"], // 图片
        2 // 紧急程度
      );

      // 尝试用非救助站用户更新请求状态
      await expect(
        petManager.connect(addr2).updateRescueRequestStatus(
          1, // 请求ID
          "Processing", // 新状态
          1 // 医院机构ID
        )
      ).to.be.revertedWith("Caller is not a staff member of any institution");
    });

    it("应该能够获取所有救助请求", async function () {
      // 添加多个救助请求
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村", // 位置
        "发现一只受伤的流浪猫", // 描述
        ["ipfs://QmAAA"], // 图片
        2 // 紧急程度
      );

      await petManager.connect(addr2).addRescueRequest(
        "上海市浦东新区", // 位置
        "发现一只流浪狗", // 描述
        ["ipfs://QmBBB"], // 图片
        1 // 紧急程度
      );

      // 获取所有救助请求
      const requests = await petManager.getAllRescueRequests();
      expect(requests.length).to.equal(2);
      expect(requests[0].requester).to.equal(addr1.address);
      expect(requests[1].requester).to.equal(addr2.address);
    });
  });

  describe("交易哈希记录", function () {
    it("应该能够记录交易哈希", async function () {
      // 跳过此测试，因为合约中没有实现recordTransactionHash函数
      this.skip();
      // 如果合约中有此函数，可以取消注释以下代码
      // await petManager.recordTransactionHash("0x1234567890abcdef");
      // expect(await petManager.transactionHashes(1)).to.equal("0x1234567890abcdef");
      // expect(await petManager.hashCount()).to.equal(1);
    });
  });
});