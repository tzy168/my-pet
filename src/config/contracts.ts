import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    abi: InstitutionManagerArtifact.abi,
  },
}
