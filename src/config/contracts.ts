import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: InstitutionManagerArtifact.abi,
  },
}
