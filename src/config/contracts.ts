import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0x59b670e9fA9D0A427751Af201D676719a970857b',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d',
    abi: InstitutionManagerArtifact.abi,
  },
}
