import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Chip,
  Button,
} from "@mui/material"
import { useRouter } from "next/router"
import { RoleType, UserType, InstitutionType } from "../stores/types"

const UserManagement: React.FC = observer(() => {
  const router = useRouter()
  const { userContract, isLoading, userInfo, setLoading } = useGlobalStore()
  const [users, setUsers] = useState<any[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  // 筛选状态
  const [searchName, setSearchName] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [filterRole, setFilterRole] = useState<number | "">("")
  const [filterUserType, setFilterUserType] = useState<number | "">("")

  useEffect(() => {
    // 检查是否是管理员
    if (userInfo && Number(userInfo.roleId) !== RoleType.Admin) {
      router.push("/")
      return
    }

    if (userContract) {
      fetchAllUsers()
    }
  }, [userContract, userInfo])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      const result = await userContract?.getAllUsers()
      setUsers(result)
    } catch (error: any) {
      console.error("获取用户列表失败:", error)
      setSnackbar({
        open: true,
        message: "获取用户列表失败",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case RoleType.Admin:
        return "管理员"
      case RoleType.User:
        return "普通用户"
      case RoleType.Hospital:
        return "医院人员"
      case RoleType.Shelter:
        return "救助站人员"
      default:
        return "未知角色"
    }
  }

  const getUserTypeName = (userType: number) => {
    return userType === UserType.Personal ? "个人用户" : "机构用户"
  }

  const getInstitutionTypeName = (instType: number) => {
    return instType === InstitutionType.Hospital ? "宠物医院" : "救助站"
  }

  const filteredUsers = users.filter((user) => {
    const matchName = searchName
      ? user.name.toLowerCase().includes(searchName.toLowerCase())
      : true
    const matchEmail = searchEmail
      ? user.email.toLowerCase().includes(searchEmail.toLowerCase())
      : true
    const matchRole =
      filterRole !== "" ? Number(user.roleId) === filterRole : true
    const matchUserType =
      filterUserType !== "" ? Number(user.userType) === filterUserType : true
    return matchName && matchEmail && matchRole && matchUserType
  })

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">用户管理</Typography>
        <Button variant="outlined" onClick={() => router.push("/admin")}>
          返回系统管理
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="搜索用户名"
          size="small"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ width: 200 }}
        />
        <TextField
          label="搜索邮箱"
          size="small"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>用户角色</InputLabel>
          <Select
            value={filterRole}
            label="用户角色"
            onChange={(e) => setFilterRole(e.target.value as number | "")}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value={0}>管理员</MenuItem>
            <MenuItem value={1}>普通用户</MenuItem>
            <MenuItem value={2}>医院人员</MenuItem>
            <MenuItem value={3}>救助站人员</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>用户类型</InputLabel>
          <Select
            value={filterUserType}
            label="用户类型"
            onChange={(e) => setFilterUserType(e.target.value as number | "")}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value={0}>个人用户</MenuItem>
            <MenuItem value={1}>机构用户</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>邮箱</TableCell>
              <TableCell>电话</TableCell>
              <TableCell>钱包地址</TableCell>
              <TableCell>用户类型</TableCell>
              <TableCell>用户角色</TableCell>
              <TableCell>关联机构</TableCell>
              <TableCell>宠物数量</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user, index) => (
              <TableRow key={index}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell
                  sx={{
                    maxWidth: 150,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.wallet}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getUserTypeName(Number(user.userType))}
                    color={
                      user.userType === UserType.Personal
                        ? "primary"
                        : "secondary"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getRoleName(Number(user.roleId))}
                    color={
                      user.roleId === RoleType.Admin
                        ? "error"
                        : user.roleId === RoleType.User
                          ? "default"
                          : "info"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {Number(user.orgId) > 0 ? (
                    <Chip
                      label={`ID: ${user.orgId}`}
                      color="warning"
                      size="small"
                    />
                  ) : (
                    "无"
                  )}
                </TableCell>
                <TableCell>{user.petIds ? user.petIds.length : 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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

export default UserManagement
