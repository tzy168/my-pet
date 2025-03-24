import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';
import { saveImageToIndexedDB, getImageFromIndexedDB } from './ipfsStorage';

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
    
    // 如果没有有效的IPFS客户端，使用IndexedDB存储作为备选方案
    if (!client) {
      try {
        // 保存到IndexedDB并返回图片ID
        const imageId = await saveImageToIndexedDB(file);
        console.log('使用IndexedDB存储，图片ID:', imageId);
        return `local:${imageId}`;
      } catch (error) {
        console.error('保存到IndexedDB失败:', error);
        throw new Error('无法保存图片');
      }
    }
    
    // 正常上传到IPFS
    const fileBuffer = await file.arrayBuffer();
    const result = await client.add(Buffer.from(fileBuffer));
    
    // 返回IPFS的CID
    return result.path;
  } catch (error) {
    console.error('上传到IPFS失败:', error);
    
    // 出错时也使用IndexedDB存储作为备选方案
    try {
      const imageId = await saveImageToIndexedDB(file);
      console.log('IPFS上传失败，使用IndexedDB存储，图片ID:', imageId);
      return `local:${imageId}`;
    } catch (storageError) {
      console.error('保存到IndexedDB也失败:', storageError);
      throw new Error('无法保存图片');
    }
  }
};

/**
 * 获取IPFS网关URL
 * @param cid IPFS的CID或本地URL
 * @returns IPFS网关URL或本地URL
 */
export const getIPFSGatewayUrl = async (cid: string): Promise<string> => {
  // 如果是本地存储的图片ID
  if (cid.startsWith('local:')) {
    try {
      const imageId = cid.substring(6); // 去掉'local:'前缀
      // 不直接返回Blob URL，而是返回一个特殊格式的URL，包含图片ID
      // 这样在页面刷新后，我们仍然可以通过这个ID从IndexedDB获取图片
      return `local:${imageId}`;
    } catch (error) {
      console.error('处理本地图片ID失败:', error);
      return '/images/pet-placeholder.png'; // 返回默认图片
    }
  }
  // 如果是blob URL（兼容旧数据），直接返回
  if (cid.startsWith('blob:')) {
    return cid;
  }
  // 否则使用IPFS网关
  return `https://ipfs.io/ipfs/${cid}`;
};