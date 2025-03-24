import React from 'react';
import { useRouter } from 'next/router';
import { AppBar, Tabs, Tab } from '@mui/material';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const router = useRouter();
  
  // 定义导航项
  const navItems = [
    { path: '/', label: '首页' },
    { path: '/my-pets', label: '我的宠物' },
    { path: '/medical-records', label: '医疗记录' },
    { path: '/rescue-requests', label: '动物救助' },
    { path: '/profile', label: '个人资料' },
  ];

  // 根据当前路径获取活动的tab索引
  const getCurrentTabIndex = () => {
    return navItems.findIndex(item => item.path === router.pathname);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    router.push(navItems[newValue].path);
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} className={className}>
      <Tabs 
        value={getCurrentTabIndex()} 
        onChange={handleChange}
        textColor="primary"
        indicatorColor="primary"
      >
        {navItems.map((item, index) => (
          <Tab 
            key={item.path} 
            label={item.label}
            sx={{
              minWidth: 'auto',
              padding: '12px 16px',
              fontWeight: router.pathname === item.path ? 600 : 500,
              color: router.pathname === item.path ? 'primary.main' : '#666',
              '&:hover': {
                color: 'primary.main',
              },
            }}
          />
        ))}
      </Tabs>
    </AppBar>
  );
};

export default Navigation;