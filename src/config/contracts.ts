import PetManagerArtifact from "../../artifacts/contracts/PetManager.sol/PetManager.json"
import UserManagerArtifact from "../../artifacts/contracts/UserManager.sol/UserManager.json"
import InstitutionManagerArtifact from "../../artifacts/contracts/InstitutionManager.sol/InstitutionManager.json"

export const ContractConfig = {
  contractDeployerAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  PetManager: {
    address: '0x0B306BF915C4d645ff596e518fAf3F9669b97016',
    abi: PetManagerArtifact.abi,
  },
  UserManager: {
    address: '0x9A676e781A523b5d0C0e43731313A708CB607508',
    abi: UserManagerArtifact.abi,
  },
  InstitutionManager: {
    address: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    abi: InstitutionManagerArtifact.abi,
  },
}
