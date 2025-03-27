import { create } from "ipfs-http-client"
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
