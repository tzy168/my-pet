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

const Profile: React.FC = observer(() => {
  const router = useRouter()
  const {
    userInfo,
    setUserProfile,
    checkRegisteredAddress,
    getAllInstitutions,
  } = useGlobalStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "Personal" as "Personal" | "Institutional",
    orgId: 0,
  })
  const [orgList, setOrgList] = useState<{ id: number; name: string }[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

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
            orgId: Number(userInfo[6]),
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
        if (institutions && institutions.length >= 4) {
          const [ids, names, types, wallets] = institutions
          const formattedList = ids.map((id: any, index: number) => ({
            id: Number(id),
            name: names[index],
          }))
          setOrgList(formattedList)
        }
      } catch (error) {
        console.error("获取机构列表失败:", error)
      }
    }
    fetchInstitutions()
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      // 调用合约方法保存用户信息
      const result = await setUserProfile(
        formData.name,
        formData.email,
        formData.phone,
        formData.userType,
        formData.orgId
      )

      // 检查返回结果是否为错误对象
      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        !result.success
      ) {
        // 处理合约未初始化等错误
        setSnackbar({
          open: true,
          message: result.error || "保存失败，请刷新页面或重新连接钱包",
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
        message: "保存失败，请重试",
        severity: "error",
      })
    }
  }

  const handleCancel = () => {
    if (userInfo && !isNewUser) {
      setFormData({
        name: userInfo[1],
        email: userInfo[2],
        phone: userInfo[3],
        userType: Number(userInfo[5]) === 0 ? "Personal" : "Institutional",
        orgId: Number(userInfo[6]),
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
      // 如果用户类型改为个人用户，重置机构ID
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
                          orgId: Number(e.target.value),
                        })
                      }}
                      displayEmpty
                    >
                      <MenuItem value="0" disabled>
                        请选择机构
                      </MenuItem>
                      {orgList.map((org) => (
                        <MenuItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </MenuItem>
                      ))}
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
                    formData.orgId === 0
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
