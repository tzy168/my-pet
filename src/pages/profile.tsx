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
  Select,
  MenuItem,
  SelectChangeEvent,
  Avatar,
} from "@mui/material"
import styles from "../styles/Profile.module.css"
import WalletConfirmationGuide from "../components/WalletConfirmationGuide"
import { ethers } from "ethers"
import {
  UserType,
  RoleType,
  InstitutionType,
  Institution,
  UserInfo,
} from "../stores/types"

const Profile: React.FC = observer(() => {
  const router = useRouter()
  const { userInfo, setUserProfile, getAllInstitutions } = useGlobalStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [formData, setFormData] = useState<Partial<UserInfo>>({
    name: userInfo?.name || "",
    email: userInfo?.email || "",
    phone: userInfo?.phone || "",
    userType: userInfo?.userType || UserType.Personal,
    orgId: userInfo?.orgId || 0,
    roleId: userInfo?.roleId || RoleType.Admin | RoleType.User,
    avatar: userInfo?.avatar || "",
    wallet: userInfo?.wallet || "",
    isProfileSet: userInfo?.isProfileSet || false,
    petIds: userInfo?.petIds || [],
    registeredAt: userInfo?.registeredAt || 0,
  })
  const [orgList, setOrgList] = useState<Institution[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const isRegistered = userInfo?.registeredAt
        setIsNewUser(!isRegistered)
        if (isRegistered && userInfo) {
          setFormData({
            name: userInfo.name,
            email: userInfo.email,
            phone: userInfo.phone,
            userType: userInfo.userType,
            orgId: userInfo.orgId,
            roleId: userInfo.roleId as RoleType,
            avatar: userInfo.avatar,
          })
        } else {
          setIsEditing(true)
        }
      } catch (error) {
        console.error("检查用户状态失败:", error)
        setSnackbar({
          open: true,
          message: "检查用户状态失败，请刷新页面重试",
          severity: "error",
        })
      }
    }
    checkUserStatus()
  }, [userInfo])

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const institutions = await getAllInstitutions()
        setOrgList(institutions)
      } catch (error) {
        setOrgList([])
        setSnackbar({
          open: true,
          message: "获取机构列表失败，请刷新页面重试",
          severity: "error",
        })
      }
    }
    fetchInstitutions()
  }, [])

  const checkWalletBeforeSubmit = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()

      if (accounts.length === 0) {
        setSnackbar({
          open: true,
          message: "请先连接钱包！",
          severity: "warning",
        })
        return false
      }
      return true
    } catch (error) {
      console.error("钱包连接检查失败:", error)
      setSnackbar({
        open: true,
        message: "钱包连接异常，请刷新页面重试",
        severity: "error",
      })
      return false
    }
  }

  // 保存用户资料
  const handleSave = async () => {
    try {
      if (
        !formData.name!.trim() ||
        !formData.email!.trim() ||
        !formData.phone!.trim()
      ) {
        setSnackbar({
          open: true,
          message: "请填写完整的个人信息",
          severity: "warning",
        })
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email!)) {
        setSnackbar({
          open: true,
          message: "请输入有效的邮箱地址",
          severity: "warning",
        })
        return
      }
      const isWalletReady = await checkWalletBeforeSubmit()
      if (!isWalletReady) return
      setIsSubmitting(true)
      setSnackbar({
        open: true,
        message: "请在MetaMask中确认交易",
        severity: "info",
      })

      console.log({
        ...formData,
      })

      const result = await setUserProfile(
        formData.name!,
        formData.email!,
        formData.phone!,
        formData.userType === UserType.Institutional
          ? UserType.Institutional
          : UserType.Personal,
        formData.orgId!,
        formData.avatar
      )
      console.log("res", result)

      if (result && !result.success) {
        setSnackbar({
          open: true,
          message: "保存失败，请刷新页面或重新连接钱包",
          severity: "error",
        })
        return
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
          message: "请检查MetaMask插件状态并确认交易",
          severity: "warning",
        })
      } else {
        setSnackbar({
          open: true,
          message: "操作失败，请检查钱包连接状态并重试",
          severity: "error",
        })
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
        userType:
          userInfo.userType === UserType.Institutional
            ? UserType.Institutional
            : UserType.Personal,
        orgId: userInfo.orgId,
        roleId: userInfo.roleId as RoleType,
        avatar: userInfo.avatar,
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
      [name]:
        name === "userType"
          ? Number(value) === UserType.Institutional
            ? UserType.Institutional
            : UserType.Personal
          : value,
      ...(name === "userType" && Number(value) === UserType.Personal
        ? { orgId: 0 }
        : {}),
    }))
  }

  return (
    <Box className={styles.container}>
      <Card className={styles.card}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar
              src={formData.avatar || ""}
              sx={{ width: 64, height: 64, mr: 2 }}
            />
            <Typography variant="h5" component="div">
              {isNewUser ? "设置个人资料" : "个人信息"}
            </Typography>
          </Box>
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
                  error={!formData.name!.trim()}
                  helperText={!formData.name!.trim() ? "请输入用户名" : ""}
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
                  error={!formData.email!.trim()}
                  helperText={!formData.email!.trim() ? "请输入邮箱" : ""}
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
                  error={!formData.phone!.trim()}
                  helperText={!formData.phone!.trim() ? "请输入电话" : ""}
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
                    value={formData.userType?.toString()}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value={UserType.Personal.toString()}>
                      个人用户
                    </MenuItem>
                    <MenuItem value={UserType.Institutional.toString()}>
                      机构用户
                    </MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <Typography>
                  {userInfo?.userType === UserType.Personal
                    ? "个人用户"
                    : "机构用户"}
                </Typography>
              )}
            </Box>
            {Number(formData.userType) === UserType.Institutional && (
              <Box className={styles.infoItem}>
                <Typography variant="subtitle1">所属机构：</Typography>
                {isEditing ? (
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      name="orgId"
                      value={formData.orgId!.toString()}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          orgId: Number(e.target.value),
                        })
                      }}
                      displayEmpty
                      error={
                        formData.userType === UserType.Institutional &&
                        formData.orgId === 0
                      }
                    >
                      <MenuItem value="0" disabled>
                        请选择机构
                      </MenuItem>
                      {orgList && orgList.length > 0 ? (
                        orgList.map((org) => (
                          <MenuItem key={org.id} value={Number(org.id)}>
                            {org.name} (
                            {Number(org.institutionType) ===
                            InstitutionType.Hospital
                              ? "医院"
                              : "收容所"}
                            )
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
                  // <Typography>{userInfo?.orgName}</Typography>
                  <Typography>
                    {orgList.find((org) => org.id === userInfo?.orgId)?.name}
                  </Typography>
                )}
              </Box>
            )}
            {!isEditing &&
              Number(userInfo?.userType) === UserType.Institutional && (
                <Box className={styles.infoItem}>
                  <Typography variant="subtitle1">机构类型：</Typography>
                  <Typography>
                    {Number(
                      orgList.find((org) => org.id === userInfo?.orgId)
                        ?.institutionType
                    ) === InstitutionType.Hospital
                      ? "医院"
                      : "收容所"}
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
                  disabled={
                    isSubmitting ||
                    !formData.name!.trim() ||
                    !formData.email!.trim() ||
                    !formData.phone!.trim() ||
                    (formData.userType === UserType.Institutional &&
                      formData.orgId === 0)
                  }
                >
                  {isNewUser ? "完成设置" : "保存"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                编辑
              </Button>
            )}
          </Box>
          {isSubmitting && (
            <WalletConfirmationGuide actionName="保存个人资料" />
          )}
        </CardContent>
      </Card>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
})

export default Profile
