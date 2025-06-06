import { create } from "ipfs-http-client"
import { ethers } from "ethers"

const IPFS_GATEWAY = "http://localhost:8080/ipfs/"
const client = create({
  host: "localhost",
  port: 5001,
  protocol: "http",
})

export const addToIpfs = async (file: any) => {
  try {
    //上传文件
    console.log("开始上传")
    const added = await client.add(file)
    //返回文件cid
    const cid = added.path
    console.log("返回的cid:", cid)
    //拼接图片URL
    const url = `${IPFS_GATEWAY}${cid}-${file.type}`
    console.log("访问图片的URL:", url)
    return url
  } catch (e) {
    console.error("IPFS上传错误:", e)
  }
}

export const addMultipleToIpfs = async (files: File[]) => {
  try {
    const uploadPromises = files.map((file) => addToIpfs(file))
    const urls = await Promise.all(uploadPromises)
    return urls.filter((url) => url !== undefined) as string[]
  } catch (e) {
    console.error("多文件IPFS上传错误:", e)
    return []
  }
}

export const writeTransactionHashToIpfs = async (hash: string) => {
  try {
    // Convert the string to a Buffer/Uint8Array directly
    const file = new TextEncoder().encode(hash)
    const added = await client.add(file)
    const cid = added.path
    const url = `${cid}`
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
