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
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material"
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material"
import { useRouter } from "next/router"
import { ContractConfig } from "../config/contracts"
import { ethers } from "ethers"
import Spin from "../components/Spin"

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
  } = useGlobalStore()
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
    if (contract) {
      fetchInstitutions()
    }
  }, [isContractDeployer, contract])

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
    setLoading(true)
    try {
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
        await contract.addInstitution(
          institutionData.name.trim(),
          institutionData.institutionType,
          institutionData.responsiblePerson.trim()
        )
        setSnackbar({
          open: true,
          message: "添加机构成功",
          severity: "success",
        })
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

      if (error.message) {
        if (error.message.includes("missing revert data")) {
          errorMessage =
            "合约调用失败，可能是中文字符编码问题或参数格式错误，请尝试简化机构名称"
        } else if (error.message.includes("INSUFFICIENT_FUNDS")) {
          errorMessage = "钱包中的ETH余额不足以支付gas费用"
        } else if (error.message.includes("UNPREDICTABLE_GAS_LIMIT")) {
          errorMessage = "无法估算gas限制，请检查参数格式是否正确"
        } else if (error.code === -32603) {
          errorMessage = "交易执行失败，请确保您的钱包中有足够的ETH支付gas费用"
        } else if (error.reason) {
          errorMessage = `合约执行错误: ${error.reason}`
        } else {
          errorMessage = error.message
        }
      }
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
  const addStaffToInstitution = async (institutionId: number, staffAddress: string) => {
    try {
      if (!contract) {
        setSnackbar({
          open: true,
          message: "合约未初始化",
          severity: "error"
        });
        return;
      }
      
      setLoading(true);
      
      // 调用合约方法添加员工
      const tx = await contract.addStaffToInstitution(institutionId, staffAddress);
      await tx.wait();
      
      setSnackbar({
        open: true,
        message: "成功添加员工到机构",
        severity: "success"
      });
      
      // 刷新机构列表
      fetchInstitutions();
    } catch (error) {
      console.error("添加员工失败:", error);
      setSnackbar({
        open: true,
        message: "添加员工失败",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">系统管理</Typography>
        <Button variant="contained" onClick={handleAddInstitution}>
          添加机构
        </Button>
      </Box>
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
