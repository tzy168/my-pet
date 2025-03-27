import React, { useEffect, useState } from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ethers } from 'ethers';

const WalletStatus = () => {
  const [status, setStatus] = useState<'connected'|'disconnected'|'locked'|'unknown'>('unknown');
  const [address, setAddress] = useState<string>('');
  
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (!window.ethereum) {
        setStatus('disconnected');
        return;
      }
      
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          setStatus('connected');
          setAddress(accounts[0].address);
        } else {
          setStatus('locked');
        }
      } catch (error) {
        console.error('钱包状态检查错误:', error);
        setStatus('unknown');
      }
    };
    
    checkWalletStatus();
    
    // 监听账户变化
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkWalletStatus);
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', checkWalletStatus);
      }
    };
  }, []);
  
  const getStatusColor = () => {
    switch(status) {
      case 'connected': return 'success';
      case 'locked': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };
  
  const getStatusText = () => {
    switch(status) {
      case 'connected': return `已连接: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
      case 'locked': return '钱包已锁定';
      case 'disconnected': return '未连接钱包';
      default: return '钱包状态未知';
    }
  };
  
  const handleClick = async () => {
    if (status === 'disconnected' && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error('连接钱包失败:', error);
      }
    } else if (status === 'locked' && window.ethereum) {
      // 提示用户解锁钱包
      window.open('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html', '_blank');
    }
  };
  
  return (
    <Tooltip title={status === 'connected' ? address : '点击连接钱包'}>
      <Chip
        icon={<AccountBalanceWalletIcon />}
        label={getStatusText()}
        color={getStatusColor() as any}
        variant="outlined"
        clickable
        onClick={handleClick}
      />
    </Tooltip>
  );
};

export default WalletStatus; 