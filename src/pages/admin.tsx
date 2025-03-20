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
} from "@mui/material"
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material"
import { useRouter } from "next/router"

const Admin: React.FC = observer(() => {
  const router = useRouter()
  const { contract, isContractDeployer } = useGlobalStore()
  const [institutions, setInstitutions] = useState<any[]>([])
  const [selectedInstitution, setSelectedInstitution] = useState<any>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add")
  const [institutionData, setInstitutionData] = useState({
    name: "",
    institutionType: 0,
    responsiblePerson: "",
  })
  const [staffList, setStaffList] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  useEffect(() => {
    if (!isContractDeployer) {
      router.push("/")
      return
    }
    fetchInstitutions()
  }, [isContractDeployer])

  const fetchInstitutions = async () => {
    try {
      const result = await contract?.getAllInstitutions()
      if (result && result.length >= 4) {
        const [ids, names, types, wallets] = result
        const formattedInstitutions = ids.map((id: any, index: number) => ({
          id: Number(id),
          name: names[index],
          type: Number(types[index]),
          wallet: wallets[index],
        }))
        setInstitutions(formattedInstitutions)
      }
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
    }
  }

  const handleAddInstitution = () => {
    setDialogMode("add")
    setInstitutionData({
      name: "",
      institutionType: 0,
      responsiblePerson: "",
    })
    setOpenDialog(true)
  }

  const handleEditInstitution = (institution: any) => {
    setDialogMode("edit")
    setInstitutionData({
      name: institution.name,
      institutionType: institution.type,
      responsiblePerson: institution.responsiblePerson,
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
      if (dialogMode === "add") {
        await contract?.addInstitution(
          institutionData.name,
          institutionData.institutionType,
          institutionData.responsiblePerson
        )
        setSnackbar({
          open: true,
          message: "添加机构成功",
          severity: "success",
        })
      } else {
        await contract?.updateInstitution(
          selectedInstitution.id,
          institutionData.name,
          institutionData.institutionType,
          institutionData.responsiblePerson
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
      setSnackbar({
        open: true,
        message: error.message || "操作失败",
        severity: "error",
      })
    }
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">系统管理</Typography>
        <Button variant="contained" onClick={handleAddInstitution}>
          添加机构
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>类型</TableCell>
              <TableCell>负责人钱包地址</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {institutions.map((institution) => (
              <TableRow key={institution.id}>
                <TableCell>{institution.id}</TableCell>
                <TableCell>{institution.name}</TableCell>
                <TableCell>
                  {institution.type === 0 ? "宠物医院" : "宠物收容所"}
                </TableCell>
                <TableCell>{institution.wallet}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditInstitution(institution)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteInstitution(institution.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
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
    </Box>
  )
})

export default Admin
