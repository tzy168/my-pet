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
    name: "",
    email: "",
    phone: "",
    userType: "Personal" as "Personal" | "Institutional",
    orgId: "",
  })
  const [orgList, setOrgList] = useState<
    { id: number; name: string; type: number }[]
  >([])
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
            name: userInfo[1],
            email: userInfo[2],
            phone: userInfo[3],
            userType: Number(userInfo[5]) === 0 ? "Personal" : "Institutional",
            orgId: String(userInfo[6]),
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
        const institutions = await getAllInstitutions()
        console.log("获取到的机构列表:", institutions) // 添加日
        if (
          institutions &&
          Array.isArray(institutions) &&
          institutions.length >= 4
        ) {
          const [ids, names, types, wallets] = institutions
          const formattedList = ids.map((id: any, index: number) => ({
            id: Number(id),
            name: names[index],
            type: Number(types[index]), // 0=医院, 1=收容所
          }))
          console.log("格式化后的机构列表:", formattedList)
          setOrgList(formattedList)
        } else {
          console.warn("获取到的机构数据格式不正确:", institutions)
          setOrgList([])
        }
      } catch (error) {
        console.error("获取机构列表失败:", error)
        setOrgList([])
      }
    }

    fetchInstitutions()
  }, [])

  // 在 useEffect 中获取机构列表后，添加以下代码
  useEffect(() => {
    // 如果用户是机构用户且有机构ID，但没有机构名称，尝试获取机构名称
    const fetchInstitutionName = async () => {
      if (
        userInfo &&
        Number(userInfo[5]) === 1 && // 是机构用户
        Number(userInfo[6]) > 0 && // 有机构ID
        !userInfo[7] // 没有机构名称
      ) {
        try {
          // 获取所有机构
          const institutions = await getAllInstitutions()
          if (institutions && institutions.length >= 4) {
            const [ids, names, types, wallets] = institutions
            // 查找匹配的机构
            const index = ids.findIndex(
              (id: any) => Number(id) === Number(userInfo[6])
            )

            if (index !== -1) {
              // 更新用户信息中的机构名称
              const updatedUserInfo = [...userInfo]
              updatedUserInfo[7] = names[index]
              // 更新状态
              setUserInfo(updatedUserInfo)
            }
          }
        } catch (error) {
          console.error("获取机构名称失败:", error)
        }
      }
    }

    fetchInstitutionName()
  }, [userInfo, getAllInstitutions])

  const handleEdit = () => {
    setIsEditing(true)
  }

  // 在提交前检查钱包状态
  const checkWalletBeforeSubmit = async () => {
    try {
      // 尝试获取钱包账户，如果获取不到会抛出异常
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

  const handleSave = async () => {
    console.log("org", formData.orgId)

    try {
      // 表单验证
      if (!formData.name || !formData.email || !formData.phone) {
        setSnackbar({
          open: true,
          message: "请填写完整的个人信息",
          severity: "warning",
        })
        return
      }
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setSnackbar({
          open: true,
          message: "请输入有效的邮箱地址",
          severity: "warning",
        })
        return
      }
      // 验证手机号格式（中国大陆手机号）
      const phoneRegex = /^1[3-9]\d{9}$/
      if (!phoneRegex.test(formData.phone)) {
        setSnackbar({
          open: true,
          message: "请输入有效的手机号码",
          severity: "warning",
        })
        return
      }
      // 机构用户必须选择机构
      if (formData.userType === "Institutional" && formData.orgId === "") {
        setSnackbar({
          open: true,
          message: "机构用户必须选择所属机构",
          severity: "warning",
        })
        return
      }
      // 首先检查钱包状态
      const isWalletReady = await checkWalletBeforeSubmit()
      if (!isWalletReady) return
      setIsSubmitting(true)
      // 显示提示消息
      setSnackbar({
        open: true,
        message: "请在MetaMask中确认交易",
        severity: "info",
      })
      // 调用合约方法保存用户信息
      const result = await setUserProfile(
        formData.name,
        formData.email,
        formData.phone,
        formData.userType,
        formData.orgId
      )

      // 检查返回结果
      if (result && typeof result === "object") {
        if (!result.success) {
          setSnackbar({
            open: true,
            message: result.error || "保存失败，请刷新页面或重新连接钱包",
            severity: "error",
          })
          return
        }
      }
      // 成功处理
      setIsEditing(false)
      setIsNewUser(false)
      setSnackbar({
        open: true,
        message: isNewUser ? "资料设置成功" : "资料更新成功",
        severity: "success",
      })
      // 如果是新用户设置完资料，跳转到首页
      if (isNewUser) {
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    } catch (error: any) {
      console.error("保存用户资料失败:", error)
      setSnackbar({
        open: true,
        message: "请刷新页面重试!",
        severity: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (userInfo && !isNewUser) {
      setFormData({
        name: userInfo[1],
        email: userInfo[2],
        phone: userInfo[3],
        userType: Number(userInfo[5]) === 0 ? "Personal" : "Institutional",
        orgId: String(userInfo[6]),
      })
      setIsEditing(false)
    } else if (isNewUser) {
      // 新用户取消，返回登录页
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
      // 如果用户类型改为个人用户，重置机构IDd
      ...(name === "userType" && value === "Personal" ? { orgId: "" } : {}),
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
                  {userInfo &&
                    (Number(userInfo[5]) === 0 ? "个人用户" : "机构用户")}
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
                          orgId: String(e.target.value),
                        })
                      }}
                      displayEmpty
                    >
                      <MenuItem value="0" disabled>
                        请选择机构
                      </MenuItem>
                      {orgList && orgList.length > 0 ? (
                        orgList.map((org) => (
                          <MenuItem key={org.id} value={org.id.toString()}>
                            {org.name} ({org.type === 0 ? "医院" : "收容所"})
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
                  <Typography>{userInfo && userInfo[7]}</Typography>
                )}
              </Box>
            )}
            {!isEditing && userInfo && Number(userInfo[5]) === 1 && (
              <Box className={styles.infoItem}>
                <Typography variant="subtitle1">机构类型：</Typography>
                <Typography>
                  {Number(userInfo[8]) === 0 ? "宠物医院" : "宠物收容所"}
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
                    formData.userType === "Institutional" &&
                    formData.orgId === ""
                  }
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
          {isSubmitting && (
            <WalletConfirmationGuide actionName="保存个人资料" />
          )}
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
