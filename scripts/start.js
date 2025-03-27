const concurrently = require('concurrently');

// 先启动 IPFS 和 Hardhat 节点
concurrently([
  { command: 'ipfs daemon', name: 'ipfs', prefixColor: 'blue' },
  { command: 'npx hardhat node', name: 'hardhat', prefixColor: 'yellow' },
]).result.then(() => {
  // 等待一段固定时间，而不是使用 wait-on
  setTimeout(() => {
    // 然后部署合约和启动 Next.js
    concurrently([
      { command: 'npx hardhat run scripts/deploy.js --network localhost', name: 'deploy', prefixColor: 'green' },
      { command: 'next dev', name: 'next', prefixColor: 'magenta' }
    ]);
  }, 5000); // 等待5秒
}); 