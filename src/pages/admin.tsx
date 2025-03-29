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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonRounded,
} from "@mui/icons-material"
import { useRouter } from "next/router"
import { ContractConfig } from "../config/contracts"
import { ethers } from "ethers"
import { InstitutionType } from "../stores/types"

const Admin: React.FC = observer(() => {
  const router = useRouter()
  const {
    contract,
    isLoading,
    isContractDeployer,
    walletAddress,
    petContract,
    userContract,
    addInstitution,
    setLoading,
    getAllInstitutions,
  } = useGlobalStore()
  const [institutions, setInstitutions] = useState<any[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [institutionData, setInstitutionData] = useState({
    name: "",
    institutionType: 0,
    responsiblePerson: "",
    address: "",
    concatInfo: "",
  })
  const [staffList, setStaffList] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  useEffect(() => {
    if (contract) {
      fetchInstitutions()
    }
  }, [isContractDeployer, contract])

  const fetchInstitutions = async () => {
    try {
      const result = await getAllInstitutions()
      console.log("org", result)

      setInstitutions(result)
    } catch (error: any) {
      console.error("获取机构列表失败:", error)
      setSnackbar({
        open: true,
        message: "获取机构列表失败",
        severity: "error",
      })
    }
  }

  //
  const fetchInstitutionDetail = async (id: number) => {
    console.log(id)
    try {
      setLoading(true)
      const detail = await contract?.getInstitutionDetail(id)
      console.log("detail", detail)
      setSelectedInstitution({
        id: Number(detail[0]),
        name: detail[1],
        type: Number(detail[2]),
        wallet: detail[3],
        responsiblePerson: detail[4],
      })
      const staff = await contract?.getInstitutionStaff(id)
      setStaffList(staff)
    } catch (error) {
      console.error("获取机构详情失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddInstitution = () => {
    setDialogMode("add")
    setInstitutionData({
      name: "",
      institutionType: 0,
      responsiblePerson: "",
      address: "",
      concatInfo: "",
    })
    setOpenDialog(true)
  }

  const handleEditInstitution = (institution: any) => {
    setDialogMode("edit")
    setInstitutionData({
      name: institution.name,
      institutionType: institution.type,
      responsiblePerson: institution.responsiblePerson,
      address: institution.address,
      concatInfo: "",
    })
    setSelectedInstitution(institution)
    setOpenDialog(true)
  }
  const handleDeleteInstitution = async (id: number) => {
    try {
      await contract?.deleteInstitution(id)
      setSnackbar({
        open: true,
        message: "删除机构成功",
        severity: "success",
      })
      fetchInstitutions()
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "删除机构失败",
        severity: "error",
      })
    }
  }

  const handleSubmit = async () => {
    try {
      // 验证是否为合约部署者
      if (!isContractDeployer) {
        setSnackbar({
          open: true,
          message:
            "权限不足：只有系统管理员才能进行机构管理操作。请使用管理员账户重试。",
          severity: "error",
        })
        return
      }
      setLoading(true)
      // 验证表单数据
      if (!institutionData.name.trim()) {
        setSnackbar({
          open: true,
          message: "机构名称不能为空",
          severity: "error",
        })
        return
      }
      if (
        !institutionData.responsiblePerson.trim() ||
        !ethers.isAddress(institutionData.responsiblePerson)
      ) {
        setSnackbar({
          open: true,
          message: "请输入有效的负责人钱包地址",
          severity: "error",
        })
        return
      }
      if (dialogMode === "add") {
        // 添加机构 - 使用可选链时需要注意可能为null的情况
        if (!contract) {
          setSnackbar({
            open: true,
            message: "合约未初始化，请刷新页面或重新连接钱包",
            severity: "error",
          })
          return
        }
        // 直接调用合约方法，不使用可选链，以便更好地捕获错误
        await addInstitution(
          institutionData.name.trim(),
          institutionData.institutionType,
          institutionData.responsiblePerson.trim(),
          institutionData.address.trim(),
          institutionData.concatInfo
        )
      } else {
        // 更新机构
        await contract?.updateInstitution(
          selectedInstitution.id,
          institutionData.name.trim(),
          institutionData.institutionType,
          institutionData.responsiblePerson.trim()
        )
        setSnackbar({
          open: true,
          message: "更新机构成功",
          severity: "success",
        })
      }
      setOpenDialog(false)
      fetchInstitutions()
    } catch (error: any) {
      console.error("机构操作失败:", error)
      setSnackbar({
        open: true,
        message: error.message || "机构操作失败",
        severity: "error",
      })
      // 详细的错误处理
      let errorMessage = "操作失败"
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  // 添加员工到机构的函数
  const addStaffToInstitution = async (
    institutionId: number,
    staffAddress: string
  ) => {
    try {
      if (!contract) {
        setSnackbar({
          open: true,
          message: "合约未初始化",
          severity: "error",
        })
        return
      }
      setLoading(true)
      // 调用合约方法添加员工
      const tx = await contract.addStaffToInstitution(
        institutionId,
        staffAddress
      )
      await tx.wait()

      setSnackbar({
        open: true,
        message: "成功添加员工到机构",
        severity: "success",
      })

      // 刷新机构列表
      fetchInstitutions()
    } catch (error) {
      console.error("添加员工失败:", error)
      setSnackbar({
        open: true,
        message: "添加员工失败",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const [searchId, setSearchId] = useState("")
  const [searchName, setSearchName] = useState("")
  const [filterType, setFilterType] = useState<number | "">("")

  const filteredInstitutions = institutions.filter((institution) => {
    const matchId = searchId
      ? institution.id.toString().includes(searchId)
      : true
    const matchName = searchName
      ? institution.name.toLowerCase().includes(searchName.toLowerCase())
      : true
    const matchType =
      filterType !== ""
        ? Number(institution.institutionType) === filterType
        : true
    return matchId && matchName && matchType
  })

  return (
    <Box sx={{ padding: 3 }}>
      {isContractDeployer && (
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Typography variant="h5">系统管理</Typography>
          <Button variant="contained" onClick={handleAddInstitution}>
            添加机构
          </Button>
        </Box>
      )}
      {/* 系统管理导航按钮 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => router.push("/system-info")}
        >
          查看系统信息
        </Button>
      </Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        机构管理
      </Typography>
      {/* 搜索和筛选区域 */}
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <TextField
          label="搜索ID"
          size="small"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          sx={{ width: 150 }}
        />
        <TextField
          label="搜索名称"
          size="small"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ width: 200 }}
        />
        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel>机构类型</InputLabel>
          <Select
            value={filterType}
            label="机构类型"
            onChange={(e) => setFilterType(e.target.value as number | "")}
          >
            <MenuItem value="">全部</MenuItem>
            <MenuItem value={0}>宠物医院</MenuItem>
            <MenuItem value={1}>宠物收容所</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: "10%" }}>ID</TableCell>
              <TableCell sx={{ width: "10%" }}>名称</TableCell>
              <TableCell sx={{ width: "10%" }}>类型</TableCell>
              <TableCell sx={{ width: "50%" }}>负责人钱包地址</TableCell>
              <TableCell sx={{ width: "20%" }}>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInstitutions.map((institution) => (
              <TableRow key={institution.id}>
                <TableCell sx={{ width: "10%" }}>
                  {Number(institution.id)}
                </TableCell>
                <TableCell
                  sx={{
                    width: "10%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {institution.name}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {Number(institution.institutionType) ===
                  InstitutionType.Hospital
                    ? "宠物医院"
                    : "宠物收容所"}
                </TableCell>
                <TableCell
                  sx={{
                    width: "40%",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {institution.responsiblePerson}
                </TableCell>
                <TableCell sx={{ width: "20%" }}>
                  {isContractDeployer && (
                    <IconButton
                      onClick={() => handleEditInstitution(institution)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                  {isContractDeployer && (
                    <IconButton
                      onClick={() => handleDeleteInstitution(institution.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => fetchInstitutionDetail(institution.id)}
                    size="small"
                    color="primary"
                  >
                    <PersonRounded />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {dialogMode === "add" ? "添加新机构" : "编辑机构信息"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="机构名称"
            fullWidth
            value={institutionData.name}
            onChange={(e) =>
              setInstitutionData({ ...institutionData, name: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>机构类型</InputLabel>
            <Select
              value={institutionData.institutionType}
              label="机构类型"
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  institutionType: Number(e.target.value),
                })
              }
            >
              <MenuItem value={0}>宠物医院</MenuItem>
              <MenuItem value={1}>宠物收容所</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="负责人钱包地址"
            fullWidth
            value={institutionData.responsiblePerson}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                responsiblePerson: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="地址"
            fullWidth
            value={institutionData.address}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                address: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="联系方式"
            fullWidth
            value={institutionData.concatInfo}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                concatInfo: e.target.value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === "add" ? "添加" : "保存"}
          </Button>
        </DialogActions>
      </Dialog>
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

      <Dialog
        open={selectedInstitution !== null}
        onClose={() => setSelectedInstitution(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">
            {selectedInstitution?.name} - 员工列表
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, color: "text.secondary" }}
            >
              ({selectedInstitution?.type === 0 ? "宠物医院" : "宠物收容所"})
            </Typography>
          </Typography>
        </DialogTitle>
        <DialogContent>
          {staffList.length > 0 ? (
            <List sx={{ width: "100%", bgcolor: "background.paper" }}>
              {staffList.map((staffAddress, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
                    "&:last-child": { borderBottom: "none" },
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        component="div"
                        sx={{ fontFamily: "monospace" }}
                      >
                        {staffAddress}
                      </Typography>
                    }
                    secondary={`员工 #${index + 1}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">暂无员工信息</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSelectedInstitution(null)}
            variant="contained"
          >
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
})

export default Admin
