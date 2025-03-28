import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0x67d269191c92Caf3cD7723F116c85e6E9bf55933',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0xc5a5C42992dECbae36851359345FE25997F5C42d',
    abi: InstitutionManagerArtifact.abi,
  },
}
