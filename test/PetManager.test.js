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
      expect(pet.owner).to.equal("0x0000000000000000000000000000000000000000");
      expect(pet.adoptionStatus).to.equal(3); // NotAvailable
    });

    it("用户应该能够获取自己的宠物列表", async function () {
      // 添加两只宠物
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

      await petManager.connect(addr1).addPet(
        "小花",
        "猫",
        "橘猫",
        "母",
        1,
        "温顺的小猫",
        "ipfs://QmYYY",
        0, // Healthy
        3  // NotAvailable
      );

      // 获取用户宠物列表
      const userPets = await petManager.getUserPets(addr1.address);
      expect(userPets.length).to.equal(2);
      expect(userPets[0].name).to.equal("小白");
      expect(userPets[1].name).to.equal("小花");
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

      // 验证宠物健康状态
      const pet = await petManager.getPetById(1);
      expect(pet.healthStatus).to.equal(1); // Sick
    });

    it("宠物主人应该能够更新宠物健康状态", async function () {
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

      // 宠物主人更新宠物健康状态
      await petManager.connect(addr1).updatePetHealthStatus(1, 2); // Recovering

      // 验证宠物健康状态
      const pet = await petManager.getPetById(1);
      expect(pet.healthStatus).to.equal(2); // Recovering
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

      // 非医院用户和非宠物主人尝试更新宠物健康状态
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

      // 验证宠物领养状态
      const pet = await petManager.getPetById(1);
      expect(pet.adoptionStatus).to.equal(0); // Available
    });

    it("宠物主人应该能够更新宠物领养状态", async function () {
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

      // 宠物主人更新宠物领养状态
      await petManager.connect(addr1).updatePetAdoptionStatus(1, 0); // Available

      // 验证宠物领养状态
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

      // 非救助站用户和非宠物主人尝试更新宠物领养状态
      await expect(
        petManager.connect(addr2).updatePetAdoptionStatus(1, 0) // Available
      ).to.be.revertedWith("Only pet owner or shelter staff can update adoption status");
    });

    it("应该能够按健康状态获取宠物", async function () {
      // 添加两只宠物，健康状态不同
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

      await petManager.connect(addr1).addPet(
        "小花",
        "猫",
        "橘猫",
        "母",
        1,
        "温顺的小猫",
        "ipfs://QmYYY",
        1, // Sick
        3  // NotAvailable
      );

      // 获取健康状态为Healthy的宠物
      const healthyPets = await petManager.getPetsByHealthStatus(0);
      expect(healthyPets.length).to.equal(1);
      expect(healthyPets[0].name).to.equal("小白");

      // 获取健康状态为Sick的宠物
      const sickPets = await petManager.getPetsByHealthStatus(1);
      expect(sickPets.length).to.equal(1);
      expect(sickPets[0].name).to.equal("小花");
    });

    it("应该能够按领养状态获取宠物", async function () {
      // 添加四只宠物，每只宠物有不同的领养状态
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
      
      await petManager.connect(addr1).addPet(
        "小黑",
        "狗",
        "拉布拉多",
        "公",
        3,
        "友善的大狗",
        "ipfs://QmZZZ",
        0, // Healthy
        2  // Processing
      );
      
      await petManager.connect(addr1).addPet(
        "小灰",
        "猫",
        "英短",
        "公",
        2,
        "安静的小猫",
        "ipfs://QmAAA",
        0, // Healthy
        3  // NotAvailable
      );

      // 获取领养状态为Available的宠物
      const availablePets = await petManager.getPetsByAdoptionStatus(0);
      expect(availablePets.length).to.equal(1);
      expect(availablePets[0].name).to.equal("小白");

      // 获取领养状态为Adopted的宠物
      const adoptedPets = await petManager.getPetsByAdoptionStatus(1);
      expect(adoptedPets.length).to.equal(1);
      expect(adoptedPets[0].name).to.equal("小花");
      
      // 获取领养状态为Processing的宠物
      const processingPets = await petManager.getPetsByAdoptionStatus(2);
      expect(processingPets.length).to.equal(1);
      expect(processingPets[0].name).to.equal("小黑");
      
      // 获取领养状态为NotAvailable的宠物
      const notAvailablePets = await petManager.getPetsByAdoptionStatus(3);
      expect(notAvailablePets.length).to.equal(1);
      expect(notAvailablePets[0].name).to.equal("小灰");
    });
  });

  describe("医疗记录管理", function () {
    beforeEach(async function () {
      // 添加一只宠物用于测试
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

    it("医院用户应该能够添加医疗记录", async function () {
      // 医院用户添加医疗记录
      const attachments = ["ipfs://QmMedical1", "ipfs://QmMedical2"];
      await petManager.connect(addr3).addMedicalEvent(
        1,
        "感冒",
        "注射抗生素",
        100, // 医疗费用
        attachments
      );

      // 验证医疗记录ID计数器增加
      expect(await petManager.medicalEventIdCounter()).to.equal(2);

      // 获取医疗记录
      const medicalEvent = await petManager.getMedicalEvent(1);
      expect(medicalEvent.petId).to.equal(1);
      expect(medicalEvent.diagnosis).to.equal("感冒");
      expect(medicalEvent.treatment).to.equal("注射抗生素");
      expect(medicalEvent.cost).to.equal(100);
      expect(medicalEvent.doctor).to.equal(addr3.address);
      expect(medicalEvent.hospital).to.equal(1); // 医院机构ID
      expect(medicalEvent.attachments.length).to.equal(2);
      expect(medicalEvent.attachments[0]).to.equal("ipfs://QmMedical1");
      expect(medicalEvent.attachments[1]).to.equal("ipfs://QmMedical2");
    });

    it("非医院用户不应该能够添加医疗记录", async function () {
      // 普通用户尝试添加医疗记录
      const attachments = ["ipfs://QmMedical1"];
      await expect(
        petManager.connect(addr1).addMedicalEvent(
          1,
          "感冒",
          "注射抗生素",
          100,
          attachments
        )
      ).to.be.revertedWith("Caller is not a staff member of any institution");

      // 救助站用户尝试添加医疗记录
      await expect(
        petManager.connect(addr4).addMedicalEvent(
          1,
          "感冒",
          "注射抗生素",
          100,
          attachments
        )
      ).to.be.revertedWith("Caller's institution is not a hospital");
    });

    it("应该能够获取宠物的医疗记录", async function () {
      // 添加两条医疗记录
      const attachments1 = ["ipfs://QmMedical1"];
      await petManager.connect(addr3).addMedicalEvent(
        1,
        "感冒",
        "注射抗生素",
        100,
        attachments1
      );

      const attachments2 = ["ipfs://QmMedical2"];
      await petManager.connect(addr3).addMedicalEvent(
        1,
        "皮肤病",
        "外用药膏",
        80,
        attachments2
      );

      // 获取宠物的医疗记录
      const medicalHistory = await petManager.getPetMedicalHistory(1);
      expect(medicalHistory.length).to.equal(2);
      expect(medicalHistory[0].diagnosis).to.equal("感冒");
      expect(medicalHistory[1].diagnosis).to.equal("皮肤病");
    });
  });

  describe("领养管理", function () {
    beforeEach(async function () {
      // 添加一只宠物用于测试
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
      // 添加领养事件
      await petManager.connect(addr1).addAdoptionEvent(
        1,
        addr2.address,
        "正常领养",
        0 // 不通过机构
      );

      // 验证领养事件ID计数器增加
      expect(await petManager.adoptionEventIdCounter()).to.equal(2);

      // 获取领养事件
      const adoptionEvent = await petManager.getAdoptionEvent(1);
      expect(adoptionEvent.petId).to.equal(1);
      expect(adoptionEvent.adopter).to.equal(addr2.address);
      expect(adoptionEvent.previousOwner).to.equal(addr1.address);
      expect(adoptionEvent.notes).to.equal("正常领养");

      // 验证宠物所有权已转移
      const pet = await petManager.getPetById(1);
      expect(pet.owner).to.equal(addr2.address);
      expect(pet.adoptionStatus).to.equal(1); // Adopted
    });

    it("应该能够获取宠物的领养历史", async function () {
      // 添加两次领养事件
      await petManager.connect(addr1).addAdoptionEvent(
        1,
        addr2.address,
        "第一次领养",
        0
      );

      await petManager.connect(addr2).addAdoptionEvent(
        1,
        addr1.address,
        "第二次领养",
        0
      );

      // 获取宠物的领养历史
      const adoptionHistory = await petManager.getPetAdoptionHistory(1);
      expect(adoptionHistory.length).to.equal(2);
      expect(adoptionHistory[0].notes).to.equal("第一次领养");
      expect(adoptionHistory[0].previousOwner).to.equal(addr1.address);
      expect(adoptionHistory[0].adopter).to.equal(addr2.address);

      expect(adoptionHistory[1].notes).to.equal("第二次领养");
      expect(adoptionHistory[1].previousOwner).to.equal(addr2.address);
      expect(adoptionHistory[1].adopter).to.equal(addr1.address);
    });
  });

  describe("救助请求管理", function () {
    it("用户应该能够添加救助请求", async function () {
      // 添加救助请求
      const images = ["ipfs://QmRescue1", "ipfs://QmRescue2"];
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村",
        "发现一只受伤的流浪猫",
        images,
        4 // 紧急程度
      );

      // 验证救助请求ID计数器增加
      expect(await petManager.rescueRequestIdCounter()).to.equal(2);

      // 获取救助请求
      const rescueRequest = await petManager.getRescueRequest(1);
      expect(rescueRequest.location).to.equal("北京市海淀区中关村");
      expect(rescueRequest.description).to.equal("发现一只受伤的流浪猫");
      expect(rescueRequest.status).to.equal("pending");
      expect(rescueRequest.requester).to.equal(addr1.address);
      expect(rescueRequest.urgencyLevel).to.equal(4);
      expect(rescueRequest.images.length).to.equal(2);
      expect(rescueRequest.images[0]).to.equal("ipfs://QmRescue1");
      expect(rescueRequest.images[1]).to.equal("ipfs://QmRescue2");
    });

    it("救助站用户应该能够更新救助请求状态", async function () {
      // 添加救助请求
      const images = ["ipfs://QmRescue1"];
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村",
        "发现一只受伤的流浪猫",
        images,
        4
      );

      // 救助站用户更新救助请求状态
      await petManager.connect(addr4).updateRescueRequestStatus(
        1,
        "processing",
        2 // 救助站机构ID
      );

      // 获取更新后的救助请求
      const rescueRequest = await petManager.getRescueRequest(1);
      expect(rescueRequest.status).to.equal("processing");
      expect(rescueRequest.responderOrgId).to.equal(2);
    });

    it("非救助站用户不应该能够更新救助请求状态", async function () {
      // 添加救助请求
      const images = ["ipfs://QmRescue1"];
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村",
        "发现一只受伤的流浪猫",
        images,
        4
      );

      // 非救助站用户（普通用户addr2）尝试更新救助请求状态，应该被拒绝
      await expect(
        petManager.connect(addr2).updateRescueRequestStatus(
          1,
          "processing",
          2 // 救助站机构ID
        )
      ).to.be.revertedWith("Caller is not a staff member of any institution");

      // 非救助站用户（医院用户addr3）尝试更新救助请求状态，应该被拒绝
      await expect(
        petManager.connect(addr3).updateRescueRequestStatus(
          1,
          "processing",
          2 // 救助站机构ID
        )
      ).to.be.revertedWith("Only shelter staff can update rescue request status");

      // 验证救助请求状态未被更改
      const rescueRequest = await petManager.getRescueRequest(1);
      expect(rescueRequest.status).to.equal("pending");
      expect(rescueRequest.responderOrgId).to.equal(0);
    });

    it("非救助站用户不应该能够更新救助请求状态", async function () {
      // 添加救助请求
      const images = ["ipfs://QmRescue1"];
      await petManager.connect(addr1).addRescueRequest(
        "北京市海淀区中关村",
        "发现一只受伤的流浪猫",
        images,
        4
      );

      // 非救助站用户（普通用户addr2）尝试更新救助请求状态，应该被拒绝
      await expect(
        petManager.connect(addr2).updateRescueRequestStatus(
          1,
          "processing",
          2 // 救助站机构ID
        )
      ).to.be.revertedWith("Caller is not a staff member of any institution");

      // 非救助站用户（医院用户addr3）尝试更新救助请求状态，应该被拒绝
      await expect(
        petManager.connect(addr3).updateRescueRequestStatus(
          1,
          "processing",
          2 // 救助站机构ID
        )
      ).to.be.revertedWith("Only shelter staff can update rescue request status");

      // 验证救助请求状态未被更改
      const rescueRequest = await petManager.getRescueRequest(1);
      expect(rescueRequest.status).to.equal("pending");
      expect(rescueRequest.responderOrgId).to.equal(0);
    });
  });
});