/**
 * IndexedDB存储管理器
 * 用于在IPFS认证失败时提供本地持久化存储
 */

// 数据库名称和版本
const DB_NAME = 'myPetImagesDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

/**
 * 初始化IndexedDB
 * @returns 返回一个Promise，解析为数据库连接
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB打开失败:', event);
      reject('无法打开IndexedDB');
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 创建对象存储空间
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 保存图片到IndexedDB
 * @param imageId 图片ID
 * @param imageBlob 图片Blob数据
 * @returns 返回一个Promise，解析为保存的图片ID
 */
export const saveImageToIndexedDB = async (imageBlob: Blob): Promise<string> => {
  try {
    const db = await initDB();
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const imageData = {
        id: imageId,
        blob: imageBlob,
        timestamp: Date.now()
      };
      
      const request = store.add(imageData);
      
      request.onsuccess = () => {
        resolve(imageId);
      };
      
      request.onerror = (event) => {
        console.error('保存图片到IndexedDB失败:', event);
        reject('保存图片失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    throw new Error('无法保存图片到本地存储');
  }
};

/**
 * 从IndexedDB获取图片
 * @param imageId 图片ID
 * @returns 返回一个Promise，解析为图片的Blob URL
 */
export const getImageFromIndexedDB = async (imageId: string): Promise<string> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(imageId);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result) {
          // 创建Blob URL
          const blobUrl = URL.createObjectURL(result.blob);
          resolve(blobUrl);
        } else {
          reject('图片不存在');
        }
      };
      
      request.onerror = (event) => {
        console.error('从IndexedDB获取图片失败:', event);
        reject('获取图片失败');
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    throw new Error('无法从本地存储获取图片');
  }
};

/**
 * 检查图片是否存在于IndexedDB中
 * @param imageId 图片ID
 * @returns 返回一个Promise，解析为布尔值表示图片是否存在
 */
export const checkImageExists = async (imageId: string): Promise<boolean> => {
  try {
    const db = await initDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(imageId);
      
      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(!!result);
      };
      
      request.onerror = () => {
        resolve(false);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('IndexedDB操作失败:', error);
    return false;
  }
};