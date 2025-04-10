import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tabs,
  Tab,
} from "@mui/material"
import {
  Pets,
  AccountCircle,
  Home,
  AccountBalanceWallet,
  Store,
  LocalHospital,
  Favorite,
} from "@mui/icons-material"

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`guide-tabpanel-${index}`}
      aria-labelledby={`guide-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const SystemGuide: React.FC = observer(() => {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">系统使用指南</Typography>
      </Box>

      <Paper sx={{ width: "100%", mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<Home />} label="系统概述" />
          <Tab icon={<AccountCircle />} label="用户指南" />
          <Tab icon={<Pets />} label="宠物管理" />
        </Tabs>
      </Paper>

      {/* 系统概述 */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              系统概述
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography paragraph>
              基于区块链的宠物管理系统是一个利用区块链技术的去中心化、不可篡改等特性，构建的透明、安全、可信的宠物生命周期管理平台。
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  系统架构
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Home fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="前端技术栈"
                      secondary="Next.js + React + TypeScript + MobX"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccountBalanceWallet fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="区块链技术"
                      secondary="Ethereum + Solidity + Hardhat"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Store fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="存储方案"
                      secondary="IPFS分布式存储（用于宠物图片等非结构化数据）"
                    />
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  主要功能
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Pets fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="宠物信息管理"
                      secondary="登记、更新和查询宠物基本信息，包括品种、年龄、健康状态等"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccountCircle fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="用户身份认证"
                      secondary="基于区块链钱包的用户注册和权限管理，支持个人用户和机构用户"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocalHospital fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="机构管理"
                      secondary="宠物医院和救助站的注册、认证与人员管理"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Favorite fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="宠物领养市场"
                      secondary="发布、申请和处理领养请求，记录领养历史"
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* 用户指南 */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              用户指南
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              用户注册与登录
            </Typography>
            <Typography paragraph>
              本系统使用区块链钱包进行身份验证，无需传统的用户名和密码。
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. 准备区块链钱包"
                  secondary="安装MetaMask或其他兼容的以太坊钱包扩展程序"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. 连接钱包"
                  secondary="点击页面右上角的'连接钱包'按钮，选择您的钱包类型"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. 完善个人资料"
                  secondary="首次登录后，前往'个人资料'页面完善您的基本信息"
                />
              </ListItem>
            </List>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              用户角色与权限
            </Typography>
            <Typography paragraph>
              系统根据用户类型和关联机构自动分配不同的角色和权限：
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="普通用户"
                  secondary="可以管理自己的宠物、发布领养信息、提交救助请求等"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="医院人员"
                  secondary="可以记录和管理宠物的医疗信息，查看宠物健康状况等"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="救助站人员"
                  secondary="可以处理救助请求，管理救助站内的宠物信息等"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* 宠物管理 */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              宠物管理指南
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              添加宠物
            </Typography>
            <Typography paragraph>
              在"我的宠物"页面，您可以添加和管理您的宠物信息：
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. 点击添加宠物按钮"
                  secondary="打开宠物信息录入表单"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. 填写宠物基本信息"
                  secondary="包括名称、品种、年龄、性别等基本信息"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. 上传宠物照片"
                  secondary="选择一张清晰的宠物照片上传（将存储在IPFS上）"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. 提交信息"
                  secondary="点击提交按钮，系统会将信息写入区块链"
                />
              </ListItem>
            </List>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              更新宠物信息
            </Typography>
            <Typography paragraph>您可以随时更新您宠物的信息：</Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="1. 在宠物列表中选择要更新的宠物"
                  secondary="点击宠物卡片或详情按钮"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="2. 点击’编辑’按钮"
                  secondary="打开宠物信息编辑表单"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="3. 修改相关信息"
                  secondary="更新宠物的健康状态、描述等信息"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="4. 保存更改"
                  secondary="点击保存按钮，更新区块链上的信息"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  )
})

export default SystemGuide
