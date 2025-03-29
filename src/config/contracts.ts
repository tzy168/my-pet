import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    abi: InstitutionManagerArtifact.abi,
  },
}
