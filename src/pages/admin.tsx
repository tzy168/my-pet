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
import { ethers } from "ethers"
import { InstitutionType } from "../stores/types"

const Admin: React.FC = observer(() => {
  const router = useRouter()
  const {
    contract,
    isLoading,
    userInfo,
    isContractDeployer,
    addInstitution,
    setLoading,
    getAllInstitutions,
    addStaffToInstitution,
  } = useGlobalStore()
  const [institutions, setInstitutions] = useState<any[]>([])
  const [newStaffAddress, setNewStaffAddress] = useState("")
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
  const [staffListOpen, setStaffListOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  useEffect(() => {
    if (contract) {
      fetchInstitutions()
    }
  }, [contract])

  const fetchInstitutions = async () => {
    try {
      const result = await getAllInstitutions()
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

  const fetchInstitutionDetail = async (id: number) => {
    try {
      setLoading(true)
      const detail = await contract?.getInstitutionDetail(id)
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
      institutionType: Number(institution.institutionType),
      responsiblePerson: institution.responsiblePerson,
      address: institution.orgAddress,
      concatInfo: institution.contactInfo,
    })
    setSelectedInstitution(institution)
    setOpenDialog(true)
    // 移除 fetchInstitutionDetail 调用
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
      console.error("删除机构失败:", error)
      setSnackbar({
        open: true,
        message: error.message || "删除机构失败",
        severity: "error",
      })
    }
  }

  const handleSubmit = async () => {
    try {
      if (!isContractDeployer) {
        setSnackbar({
          open: true,
          message: "权限不足：只有系统管理员才能进行机构管理操作。",
          severity: "error",
        })
        return
      }
      setLoading(true)
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
        await addInstitution(
          institutionData.name.trim(),
          institutionData.institutionType,
          institutionData.responsiblePerson.trim(),
          institutionData.address.trim(),
          institutionData.concatInfo
        )
      } else {
        await contract?.updateInstitution(
          Number(selectedInstitution.id),
          institutionData.name.trim(),
          institutionData.address.trim(),
          institutionData.concatInfo.trim()
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
        机构管理🏛️
      </Typography>
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
                  <IconButton
                    onClick={() => {
                      fetchInstitutionDetail(institution.id)
                      setStaffListOpen(true)
                    }}
                    size="small"
                    color="primary"
                  >
                    <PersonRounded />
                  </IconButton>
                  {isContractDeployer && (
                    <IconButton
                      onClick={() => handleDeleteInstitution(institution.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
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
              value={Number(institutionData.institutionType)}
              label="机构类型"
              disabled={dialogMode === "edit"}
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
            disabled={dialogMode === "edit"}
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

      <Dialog
        open={staffListOpen}
        onClose={() => setStaffListOpen(false)}
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
                        {`员工 #${index + 1}:` + staffAddress}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography color="text.secondary">暂无员工信息</Typography>
            </Box>
          )}
          {(Number(userInfo?.roleId) === 0 ||
            userInfo?.wallet === selectedInstitution?.responsiblePerson) && (
            <div>
              <TextField
                margin="dense"
                label="新员工地址"
                fullWidth
                value={newStaffAddress}
                onChange={(e) => setNewStaffAddress(e.target.value)}
              />
              <Button
                onClick={async () => {
                  try {
                    if (ethers.isAddress(newStaffAddress)) {
                      const result = await addStaffToInstitution(
                        selectedInstitution.id,
                        newStaffAddress
                      )
                      if (result.success) {
                        setSnackbar({
                          open: true,
                          message: "员工添加成功",
                          severity: "success",
                        })
                        fetchInstitutionDetail(selectedInstitution.id)
                      } else {
                        setSnackbar({
                          open: true,
                          message: "员工添加失败，请检查员工地址是否正确",
                          severity: "error",
                        })
                      }
                    } else {
                      setSnackbar({
                        open: true,
                        message: "请输入有效的员工地址",
                        severity: "error",
                      })
                    }
                    // 关闭弹窗
                    setStaffListOpen(false)
                    setNewStaffAddress("")
                  } catch (error) {
                    console.error(error)
                    setSnackbar({
                      open: true,
                      message: "添加员工失败，请检查员工地址是否正确",
                      severity: "error",
                    })
                  }
                }}
                variant="contained"
                sx={{ mt: 2 }}
              >
                添加员工
              </Button>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedInstitution(null)
              setStaffListOpen(false)
              setNewStaffAddress("")
            }}
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
