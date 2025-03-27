import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import Image from 'next/image';

interface WalletConfirmationGuideProps {
  actionName?: string;
}

const WalletConfirmationGuide: React.FC<WalletConfirmationGuideProps> = ({ 
  actionName = "完成操作" 
}) => {
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2, mb: 2, maxWidth: "100%" }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        正在等待您确认{actionName}交易...
      </Alert>
      
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        请检查以下几点:
      </Typography>
      
      <Box sx={{ ml: 2 }}>
        <Typography paragraph sx={{ display: "flex", alignItems: "center" }}>
          1. 查看浏览器右上角是否有MetaMask扩展图标<span style={{ color: 'orange', marginLeft: '4px' }}>闪烁</span>
        </Typography>
        
        <Typography paragraph>
          2. 如果没有看到MetaMask弹窗，请点击浏览器工具栏中的MetaMask图标
        </Typography>
        
        <Typography paragraph>
          3. 确认MetaMask已解锁，并连接到本地Hardhat网络 (chainId: 31337)
        </Typography>
        
        <Typography paragraph>
          4. 在MetaMask中点击"确认"按钮完成交易
        </Typography>
      </Box>
      
      <Alert severity="warning">
        如果反复出现此问题，请尝试: 1)刷新页面 2)重启MetaMask 3)在MetaMask设置中"重置账户"
      </Alert>
    </Paper>
  );
};

export default WalletConfirmationGuide; 