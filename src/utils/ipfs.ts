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
  // 检查是否有有效的认证信息
  if (!projectId || !projectSecret || projectId === 'your_infura_project_id' || projectSecret === 'your_infura_api_secret') {
    console.warn('IPFS认证信息未正确配置，将使用公共网关');
    // 返回一个模拟客户端，将使用本地存储
    return null;
  }
  
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
 * @returns 返回IPFS的CID或本地文件URL
 */
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const client = ipfsClient();
    
    // 如果没有有效的IPFS客户端，使用本地存储作为备选方案
    if (!client) {
      // 生成一个随机ID作为文件名
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileName = `local_${randomId}_${file.name}`;
      
      // 创建一个本地URL（这只是临时的，页面刷新后会丢失）
      const localUrl = URL.createObjectURL(file);
      
      console.log('使用本地存储:', localUrl);
      return localUrl;
    }
    
    // 正常上传到IPFS
    const fileBuffer = await file.arrayBuffer();
    const result = await client.add(Buffer.from(fileBuffer));
    
    // 返回IPFS的CID
    return result.path;
  } catch (error) {
    console.error('上传到IPFS失败:', error);
    
    // 出错时也使用本地存储作为备选方案
    const randomId = Math.random().toString(36).substring(2, 15);
    const localUrl = URL.createObjectURL(file);
    console.log('IPFS上传失败，使用本地存储:', localUrl);
    return localUrl;
  }
};

/**
 * 获取IPFS网关URL
 * @param cid IPFS的CID或本地URL
 * @returns IPFS网关URL或本地URL
 */
export const getIPFSGatewayUrl = (cid: string): string => {
  // 如果是本地URL，直接返回
  if (cid.startsWith('blob:')) {
    return cid;
  }
  // 否则使用IPFS网关
  return `https://ipfs.io/ipfs/${cid}`;
};