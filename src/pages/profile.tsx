import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import { useRouter } from "next/router"
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material"
import styles from "../styles/Profile.module.css"
import WalletConfirmationGuide from "../components/WalletConfirmationGuide"
import { ethers } from "ethers"

const Profile: React.FC = observer(() => {
  const router = useRouter()
  const {
    userInfo,
    setUserProfile,
    checkRegisteredAddress,
    getAllInstitutions,
    setUserInfo,
  } = useGlobalStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [formData, setFormData] = useState({
    name: userInfo?.name || "",
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
    userType: userInfo?.userType === UserType.Institutional ? "Institutional" : "Personal",
    orgId: userInfo?.orgId || 0,
    roleId: userInfo?.roleId || RoleType.User,
    avatar: userInfo?.avatar || "",
  })
  const [orgList, setOrgList] = useState<Institution[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 检查用户是否是新用户
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const isRegistered = await checkRegisteredAddress()
        setIsNewUser(!isRegistered)
        if (isRegistered && userInfo) {
          // 已注册用户，加载用户信息
          setFormData({
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            userType: userInfo.userType === UserType.Institutional ? "Institutional" : "Personal",
            orgId: userInfo.orgId,
          })
        } else {
          // 新用户，设置为编辑模式
          setIsEditing(true)
        }
      } catch (error) {
        console.error("检查用户状态失败:", error)
      }
    }
    checkUserStatus()
  }, [userInfo])

  // 获取机构列表
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const institutions = await getAllInstitutions();
        setOrgList(institutions);
      } catch (error) {
        console.error("获取机构列表失败:", error);
        setOrgList([]);
      }
    };
    
    fetchInstitutions();
  }, []);

  // 在提交前检查钱包状态
  const checkWalletBeforeSubmit = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length === 0) {
        setSnackbar({
          open: true,
          message: "请先连接钱包！",
          severity: "warning",
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("钱包连接检查失败:", error);
      setSnackbar({
        open: true,
        message: "钱包连接异常，请刷新页面重试",
        severity: "error",
      });
      return false;
    }
  };

  const handleSave = async () => {
    try {
      const isWalletReady = await checkWalletBeforeSubmit();
      if (!isWalletReady) return;
      
      setIsSubmitting(true);
      
      setSnackbar({
        open: true,
        message: "请按以下步骤操作：\n1. 点击浏览器扩展栏的MetaMask图标\n2. 在弹出窗口中查看待处理交易\n3. 点击确认按钮完成授权",
        severity: "info",
      });
      
      const result = await setUserProfile(
        formData.name,
        formData.email,
        formData.phone,
        formData.userType,
        formData.orgId,
        formData.avatar
      )

      if (result && !result.success) {      
        setSnackbar({
          open: true,
          message: result.error || "保存失败，请刷新页面或重新连接钱包",
          severity: "error",
        })
        return;
      }

      setIsEditing(false)
      setIsNewUser(false)

      setSnackbar({
        open: true,
        message: isNewUser ? "资料设置成功" : "资料更新成功",
        severity: "success",
      })

      if (isNewUser) {
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    } catch (error: any) {
      console.error("保存用户资料失败:", error)
      if (error.code === 4100 || (error.error && error.error.code === 4100)) {
        setSnackbar({
          open: true,
          message: "请检查：\n1. MetaMask插件是否有待处理交易\n2. 是否点击了确认按钮\n3. 网络连接是否正常",
          severity: "warning"
        });
      } else {
        setSnackbar({
          open: true,
          message: "操作失败，请检查钱包连接状态并重试",
          severity: "error"
        });
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (userInfo && !isNewUser) {
      setFormData({
        name: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
        userType: userInfo.userType === UserType.Institutional ? "Institutional" : "Personal",
        orgId: userInfo.orgId,
      })
      setIsEditing(false)
    } else if (isNewUser) {
      router.push("/")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "userType" && value === "Personal" ? { orgId: 0 } : {}),
    }))
  }

  return (
    <Box className={styles.container}>
      <Card className={styles.card}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            {isNewUser ? "设置个人资料" : "个人信息"}
          </Typography>
          {isNewUser && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              请设置您的个人资料，以便使用系统功能
            </Typography>
          )}
          <Box className={styles.infoContainer}>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">用户名：</Typography>
              {isEditing ? (
                <TextField
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  size="small"
                  required
                />
              ) : (
                <Typography>{formData.name}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">邮箱：</Typography>
              {isEditing ? (
                <TextField
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  size="small"
                  required
                  type="email"
                />
              ) : (
                <Typography>{formData.email}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">电话：</Typography>
              {isEditing ? (
                <TextField
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  size="small"
                  required
                />
              ) : (
                <Typography>{formData.phone}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">用户类型：</Typography>
              {isEditing ? (
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    name="userType"
                    value={formData.userType}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Personal">个人用户</MenuItem>
                    <MenuItem value="Institutional">机构用户</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Typography>
                  {userInfo && (userInfo.userType === UserType.Personal ? "个人用户" : "机构用户")}
                </Typography>
              )}
            </Box>
            {formData.userType === "Institutional" && (
              <Box className={styles.infoItem}>
                <Typography variant="subtitle1">所属机构：</Typography>
                {isEditing ? (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      name="orgId"
                      value={formData.orgId.toString()}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          orgId: Number(e.target.value),
                        });
                      }}
                      displayEmpty
                    >
                      <MenuItem value="0" disabled>
                        请选择机构
                      </MenuItem>
                      {orgList && orgList.length > 0 ? (
                        orgList.map((org) => (
                          <MenuItem key={org.id} value={org.id.toString()}>
                            {org.name} ({org.institutionType === InstitutionType.Hospital ? "医院" : "收容所"})
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="0" disabled>
                          加载机构列表中...
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography>{userInfo?.orgName}</Typography>
                )}
              </Box>
            )}
            {!isEditing && userInfo && userInfo.userType === UserType.Institutional && (
              <Box className={styles.infoItem}>
                <Typography variant="subtitle1">机构类型：</Typography>
                <Typography>
                  {userInfo.orgType === InstitutionType.Hospital ? "宠物医院" : "宠物收容所"}
                </Typography>
              </Box>
            )}
          </Box>
          <Box className={styles.buttonContainer}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={formData.userType === "Institutional" && formData.orgId === 0}
                >
                  {isNewUser ? "完成设置" : "保存"}
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  取消
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleEdit}>
                编辑
              </Button>
            )}
          </Box>
          {isSubmitting && <WalletConfirmationGuide actionName="保存个人资料" />}
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
})

export default Profile
