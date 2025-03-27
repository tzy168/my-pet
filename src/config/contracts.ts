import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    abi: InstitutionManagerArtifact.abi,
  },
}
