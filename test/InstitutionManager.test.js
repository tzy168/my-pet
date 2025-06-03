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

  describe("机构管理模块测试（表6-3）", function () {
    it("1. 正常添加机构", async function () {
      // 测试场景：合约部署者添加新的宠物医院或救助站
      // 输入及操作：调用addInstitution函数，传入参数：名称"宠物医院A"，类型0（医院），负责人地址addr1，地址"成都市双流区"，联系方式"000-000000"
      
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 预期结果：机构ID计数器递增（如从0→1），新机构信息存入institutions数组，可通过getAllInstitutions查询到新增记录
      expect(await institutionManager.institutionIdCounter()).to.equal(2);

      // 验证机构信息
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.id).to.equal(1);
      expect(institutionDetail.name).to.equal("宠物医院A");
      expect(institutionDetail.institutionType).to.equal(0); // Hospital
      expect(institutionDetail.responsiblePerson).to.equal(addr1.address);
      expect(institutionDetail.orgAddress).to.equal("成都市双流区");
      expect(institutionDetail.contactInfo).to.equal("000-000000");
      
      // 验证可以通过getAllInstitutions查询到新增记录
      const institutions = await institutionManager.getAllInstitutions();
      expect(institutions.length).to.equal(1);
      expect(institutions[0].name).to.equal("宠物医院A");
    });

    it("2. 重复添加相同机构", async function () {
      // 测试场景：尝试添加与已注册机构完全相同的信息
      // 输入及操作：再次调用addInstitution，传入与已存在机构（如"宠物医院A"）完全一致的参数
      
      // 先添加一个机构
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 尝试再次添加相同机构
      await expect(
        institutionManager.addInstitution(
          "宠物医院A",
          0,
          addr1.address,
          "成都市双流区",
          "000-000000"
        )
      ).to.be.revertedWith("Address already associated with an institution");

      // 预期结果：交易回滚，系统不新增机构ID，institutions数组无重复记录
      expect(await institutionManager.institutionIdCounter()).to.equal(2); // ID计数器仍为2
      
      // 验证机构数量未增加
      const institutions = await institutionManager.getAllInstitutions();
      expect(institutions.length).to.equal(1);
    });

    it("3. 非合约部署者添加机构", async function () {
      // 测试场景：非部署者账户尝试添加机构
      // 输入及操作：普通用户账户（非合约部署者）调用addInstitution函数
      
      // 使用非部署者账户尝试添加机构
      await expect(
        institutionManager.connect(addr1).addInstitution(
          "宠物医院B",
          0,
          addr2.address,
          "成都市武侯区",
          "000-111111"
        )
      ).to.be.revertedWith("Only deployer can add institutions");

      // 预期结果：交易回滚，智能合约抛出错误"Only deployer can add institutions"，前端提示权限不足
      expect(await institutionManager.institutionIdCounter()).to.equal(1); // ID计数器未增加
    });

    it("4. 更新机构信息", async function () {
      // 测试场景：机构负责人修改机构名称、地址等信息
      // 输入及操作：机构负责人调用updateInstitution，将机构名称改为"宠物医院A新名称"，地址改为"成都市武侯区"
      
      // 先添加一个机构
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 机构负责人更新机构信息
      await institutionManager.connect(addr1).updateInstitution(
        1,
        "宠物医院A新名称",
        "成都市武侯区",
        "000-000000"
      );

      // 预期结果：institutions数组中对应机构的字段更新，链上数据同步修改，通过getInstitutionDetail可查询到新信息
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A新名称");
      expect(institutionDetail.orgAddress).to.equal("成都市武侯区");
    });

    it("5. 非机构负责人更新信息", async function () {
      // 测试场景：机构普通员工（非负责人）尝试修改机构信息
      // 输入及操作：机构普通员工账户调用updateInstitution，修改机构地址
      
      // 先添加一个机构
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 添加员工到机构
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      // 非负责人尝试更新机构信息
      await expect(
        institutionManager.connect(addr2).updateInstitution(
          1,
          "宠物医院A新名称",
          "成都市武侯区",
          "000-000000"
        )
      ).to.be.revertedWith("Only responsible person or deployer can update institution");

      // 预期结果：交易回滚，智能合约抛出"Only institution owner can update info"，前端提示"只有机构负责人能更改信息"
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("宠物医院A"); // 名称未被修改
    });

    it("6. 删除存在关联用户的机构", async function () {
      // 测试场景：删除已关联员工的机构
      // 输入及操作：调用deleteInstitution删除ID=1的机构（该机构存在员工addr2）
      
      // 先添加一个机构
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 添加员工到机构
      await institutionManager.connect(addr1).addStaffToInstitution(1, addr2.address);

      // 验证员工已关联到机构
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(1);

      // 删除机构
      await institutionManager.deleteInstitution(1);

      // 预期结果：机构信息从institutions数组中移除，员工addr2的institutionId字段清零，无法再以该机构身份操作
      // 验证员工关联已解除
      expect(await institutionManager.staffToInstitution(addr2.address)).to.equal(0);
      expect(await institutionManager.staffToInstitution(addr1.address)).to.equal(0);
      
      // 验证机构信息已被清空
      const institutionDetail = await institutionManager.getInstitutionDetail(1);
      expect(institutionDetail.name).to.equal("");
      expect(institutionDetail.responsiblePerson).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("7. 删除未注册机构", async function () {
      // 测试场景：调用删除功能时传入不存在的机构ID
      // 输入及操作：调用deleteInstitution(999)，尝试删除ID=999的机构（实际最大ID为1）
      
      // 先添加一个机构，使最大ID为1
      await institutionManager.addInstitution(
        "宠物医院A",
        0, // Hospital类型
        addr1.address,
        "成都市双流区",
        "000-000000"
      );

      // 尝试删除不存在的机构
      await expect(
        institutionManager.deleteInstitution(999)
      ).to.be.revertedWith("Institution does not exist");

      // 预期结果：系统提示"Institution not found"，institutions数组无变化，ID计数器不递减
      expect(await institutionManager.institutionIdCounter()).to.equal(2); // ID计数器未变化
    });
  });
});

