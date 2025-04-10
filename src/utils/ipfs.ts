import { create } from "ipfs-http-client"
import { ethers } from "ethers"

const IPFS_GATEWAY = "http://localhost:8080/ipfs/"
const client = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
})

export const addToIpfs = async (e: any) => {
  console.log(e)
  const file = e
  try {
    const added = await client.add(file)
    const cid = added.path
    const url = `${IPFS_GATEWAY}${cid}`
    return url
  } catch (e) {
    console.error("IPFS上传错误:", e)
  }
}

export const writeTransactionHashToIpfs = async (hash: string) => {
  try {
    // Convert the string to a Buffer/Uint8Array directly
    const file = new TextEncoder().encode(hash)
    const added = await client.add(file)
    const cid = added.path
    const url = `${IPFS_GATEWAY}${cid}`
    return url
  } catch (e) {
    console.error("IPFS上传错误:", e)
  }
}

export const fetchTransactionHashes = async (
  contract: ethers.Contract,
  hash?: string
) => {
  try {
    const count = await contract.hashCount()
    const hashes = []

    for (let i = 0; i < count; i++) {
      const hash = await contract.transactionHashes(i)
      hashes.push(hash)
    }

    return hashes
  } catch (e) {
    console.error("获取交易hash错误:", e)
    return []
  }
}
