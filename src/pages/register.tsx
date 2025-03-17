import React, { use, useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/router"
import styles from "../styles/Register.module.css"
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material"
import { Message, Visibility, VisibilityOff } from "@mui/icons-material"
import { useGlobalStore } from "../stores/global"

const Register: React.FC = () => {
  const router = useRouter()
  const {
    walletAddress,
    checkRegisteredAddress,
    registerUser,
    setIsRegistered,
    getAllInstitutions,
  } = useGlobalStore()

  useEffect(() => {
    const checkRegistration = async () => {
      if (!walletAddress) {
        console.log("钱包地址为空")
        return
      }
      try {
        const isRegistered = await checkRegisteredAddress()
        if (isRegistered) {
          console.log(isRegistered)

          router.push("/")
        }
      } catch (error) {
        console.error("检查注册状态失败:", error)
      }
    }
    checkRegistration()
  }, [])
  // 机构列表状态
  const [orgList, setOrgList] = useState<{ id: number; name: string }[]>([])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    userType: "Personal" as "Personal" | "Institutional",
    orgId: 0,
  })

  const [showPassword, setShowPassword] = useState(false)

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    orgId: "",
  })

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      name: "",
      email: "",
      phone: "",
      password: "",
      orgId: "",
    }
    if (!formData.name.trim()) {
      newErrors.name = "用户名不能为空"
      isValid = false
    }

    if (!formData.email.trim()) {
      newErrors.email = "邮箱不能为空"
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "邮箱格式不正确"
      isValid = false
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "电话不能为空"
      isValid = false
    } else if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = "请输入11位手机号码"
      isValid = false
    }

    if (!formData.password.trim()) {
      newErrors.password = "密码不能为空"
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = "密码长度至少6位"
      isValid = false
    }

    if (formData.userType === "Institutional" && formData.orgId === 0) {
      newErrors.orgId = "机构用户必须选择机构ID"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  // 组件加载时获取机构列表
  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const institutions = await getAllInstitutions()
        if (institutions && institutions.length >= 4) {
          const [ids, names, types, wallets] = institutions
          // 将获取的机构数据转换为前端需要的格式
          const formattedList = ids.map((id: any, index: number) => ({
            id: Number(id),
            name: names[index],
          }))

          setOrgList(formattedList)
        }
      } catch (error) {
        console.error("获取机构列表失败:", error)
        setSnackbar({
          open: true,
          message: "获取机构列表失败，请刷新页面重试",
          severity: "error",
        })
      }
    }
    fetchInstitutions()
  }, [])

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const success = await registerUser(
        formData.name,
        formData.email,
        formData.phone,
        formData.password,
        formData.userType,
        formData.orgId
      )
      if (success) {
        setIsRegistered(true)
        setSnackbar({
          open: true,
          message: "注册成功！",
          severity: "success",
        })
        setTimeout(() => {
          router.push("/")
        })
      }
    } catch (error: any) {
      console.error("注册失败:", error)
      let errorMessage = "注册失败，请稍后重试"
      if (error.code === -32603) {
        errorMessage = "交易执行失败，请确保您的钱包中有足够的ETH支付gas费用"
      } else if (
        error.message &&
        error.message.includes("User already registered")
      ) {
        errorMessage = "该钱包地址已经注册过了"
      } else if (
        error.message &&
        error.message.includes("user rejected transaction")
      ) {
        errorMessage = "您取消了交易签名"
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    }
  }

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }))
  }

  return (
    <div className={styles.container}>
      <div className={styles.registerBox}>
        <h3>用户注册</h3>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="用户名"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="邮箱"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="电话"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="密码"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            required
            InputProps={{
              endAdornment: (
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              ),
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="userType-select">用户类型</InputLabel>
            <Select
              labelId="userType-select"
              name="userType"
              label="用户类型"
              value={formData.userType}
              onChange={handleChange}
              required
            >
              <MenuItem value="Personal">个人用户</MenuItem>
              <MenuItem value="Institutional">机构用户</MenuItem>
            </Select>
          </FormControl>
          {formData.userType === "Institutional" && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="org-select-label">关联机构</InputLabel>
              <Select
                labelId="org-select-label"
                label="关联机构"
                id="org-select"
                name="orgId"
                value={formData.orgId}
                onChange={handleChange}
                error={!!errors.orgId}
                required
              >
                {orgList.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            style={{ marginTop: "20px" }}
            onClick={handleSubmit}
          >
            注册
          </Button>
        </form>
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  )
}

export default observer(Register)
