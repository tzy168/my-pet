import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// IPFS配置
const projectId = process.env.NEXT_PUBLIC_INFURA_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_INFURA_API_SECRET;
const auth = projectId && projectSecret
  ? 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
  : '';

// 创建IPFS客户端
const ipfsClient = () => {
  const client = create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
      authorization: auth,
    },
  });
  return client;
};

/**
 * 上传文件到IPFS
 * @param file 要上传的文件
 * @returns 返回IPFS的CID
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    if (!projectId || !projectSecret) {
      throw new Error('IPFS项目ID或密钥未配置');
    }

    const client = ipfsClient();
    const fileBuffer = await file.arrayBuffer();
    const result = await client.add(Buffer.from(fileBuffer));
    
    // 返回IPFS的CID
    return result.path;
  } catch (error) {
    console.error('上传到IPFS失败:', error);
    throw new Error('上传到IPFS失败');
  }
};

/**
 * 获取IPFS网关URL
 * @param cid IPFS的CID
 * @returns IPFS网关URL
 */
export const getIPFSGatewayUrl = (cid: string): string => {
  if (!cid) return '';
  // 使用Infura的IPFS网关
  return `https://ipfs.io/ipfs/${cid}`;
};