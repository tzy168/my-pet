#!/bin/bash
# 启动 IPFS 守护进程
ipfs daemon &
IPFS_PID=$!

# 启动 Hardhat 节点
npx hardhat node &
HARDHAT_PID=$!

# 等待 Hardhat 节点启动
sleep 5

# 部署合约
npx hardhat run scripts/deploy.js --network localhost

# 启动 Next.js 开发服务器
next dev

# 确保在脚本结束时终止后台进程
trap "kill $IPFS_PID $HARDHAT_PID" EXIT 