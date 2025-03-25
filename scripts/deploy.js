const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("开始部署合约...");

  // 部署InstitutionManager合约
  const InstitutionManager = await hre.ethers.getContractFactory("InstitutionManager");
  const institutionManager = await InstitutionManager.deploy();
  await institutionManager.waitForDeployment();
  const institutionManagerAddress = await institutionManager.getAddress();
  console.log("InstitutionManager合约已部署到:", institutionManagerAddress);

  // 部署UserManager合约
  const UserManager = await hre.ethers.getContractFactory("UserManager");
  const userManager = await UserManager.deploy(institutionManagerAddress);
  await userManager.waitForDeployment();
  const userManagerAddress = await userManager.getAddress();
  console.log("UserManager合约已部署到:", userManagerAddress);

  // 部署PetManager合约
  const PetManager = await hre.ethers.getContractFactory("PetManager");
  const petManager = await PetManager.deploy(userManagerAddress, institutionManagerAddress);
  await petManager.waitForDeployment();
  const petManagerAddress = await petManager.getAddress();
  console.log("PetManager合约已部署到:", petManagerAddress);

  console.log("\n合约部署完成！");
  console.log("UserManager:", userManagerAddress);
  console.log("InstitutionManager:", institutionManagerAddress);
  console.log("PetManager:", petManagerAddress);

  // 更新合约配置文件
  updateContractConfig({
    institutionManagerAddress,
    userManagerAddress,
    petManagerAddress
  });

  // 如果不是本地网络，则进行合约验证
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n等待区块确认以便验证合约...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    try {
      await hre.run("verify:verify", {
        address: userManagerAddress,
        contract: "contracts/UserManager.sol:UserManager"
      });
      await hre.run("verify:verify", {
        address: institutionManagerAddress,
        contract: "contracts/InstitutionManager.sol:InstitutionManager"
      });
      await hre.run("verify:verify", {
        address: petManagerAddress,
        contract: "contracts/PetManager.sol:PetManager"
      });
      console.log("合约验证完成！");
    } catch (error) {
      console.error("合约验证失败:", error);
    }
  }
}

// 更新合约配置文件
function updateContractConfig({ institutionManagerAddress, userManagerAddress, petManagerAddress }) {
  const configPath = path.join(__dirname, "../src/config/contracts.ts");
  
  // 读取现有配置文件
  let configContent = fs.readFileSync(configPath, "utf8");
  
  // 使用正则表达式替换合约地址
  configContent = configContent.replace(
    /PetManager:\s*{[\s\S]*?address:\s*['"](.*?)['"]/, 
    `PetManager: {\n    address: '${petManagerAddress}'`
  );
  
  configContent = configContent.replace(
    /UserManager:\s*{[\s\S]*?address:\s*['"](.*?)['"]/, 
    `UserManager: {\n    address: '${userManagerAddress}'`
  );
  
  configContent = configContent.replace(
    /InstitutionManager:\s*{[\s\S]*?address:\s*['"](.*?)['"]/, 
    `InstitutionManager: {\n    address: '${institutionManagerAddress}'`
  );
  
  // 写入更新后的配置
  fs.writeFileSync(configPath, configContent);
  console.log("\n合约配置文件已更新:", configPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });