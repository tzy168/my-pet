import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material"
import {
  Pets as PetsIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"

interface RescueRequest {
  id: number
  location: string
  description: string
  status: string
  responderOrgId: number
  timestamp: number
}

const RescueRequests: React.FC = observer(() => {
  const { userInfo, petContract, walletAddress, isContractDeployer } =
    useGlobalStore()
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(
    null
  )
  const [rescueForm, setRescueForm] = useState({
    location: "",
    description: "",
  })
  const [updateForm, setUpdateForm] = useState({
    status: "",
    responderOrgId: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  useEffect(() => {
    // 当用户信息加载完成后，获取救助请求列表
    if (userInfo) {
      fetchRescueRequests()
    }
  }, [userInfo])

  const fetchRescueRequests = async () => {
    if (!petContract) {
      setSnackbar({
        open: true,
        message: "合约未初始化，请刷新页面或重新连接钱包",
        severity: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      // 从合约获取救助请求数据
      const requests = []
      const requestCount = await petContract.rescueRequestIdCounter()

      for (let i = 1; i < requestCount; i++) {
        const request = await petContract.rescueRequests(i - 1)
        requests.push(request)
      }

      setRescueRequests(requests)
      setIsLoading(false)
    } catch (error) {
      console.error("获取救助请求失败:", error)
      setSnackbar({
        open: true,
        message: "获取救助请求失败",
        severity: "error",
      })
      setIsLoading(false)
    }
  }

  const handleAddRescueRequest = () => {
    setRescueForm({
      location: "",
      description: "",
    })
    setOpenDialog(true)
  }

  const handleUpdateRescueRequest = (request: RescueRequest) => {
    setSelectedRequest(request)
    setUpdateForm({
      status: request.status,
      responderOrgId: request.responderOrgId,
    })
    setOpenUpdateDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false)
    setSelectedRequest(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRescueForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleUpdateChange = (
    e: React.ChangeEvent<{ name?: string; value: unknown }>
  ) => {
    const name = e.target.name as string
    const value = e.target.value as string
    setUpdateForm((prev) => ({
      ...prev,
      [name]: name === "responderOrgId" ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async () => {
    if (!rescueForm.location || !rescueForm.description) {
      setSnackbar({
        open: true,
        message: "请填写位置和描述信息",
        severity: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      // 调用合约添加救助请求
      const tx = await petContract?.addRescueRequest(
        rescueForm.location,
        rescueForm.description
      )
      await tx.wait()

      // 刷新救助请求列表
      await fetchRescueRequests()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: "添加救助请求成功",
        severity: "success",
      })
      setIsLoading(false)
    } catch (error) {
      console.error("添加救助请求失败:", error)
      setSnackbar({
        open: true,
        message: "添加救助请求失败",
        severity: "error",
      })
      setIsLoading(false)
    }
  }

  const handleUpdateSubmit = async () => {
    if (!selectedRequest) return

    try {
      setIsLoading(true)
      // 调用合约更新救助请求状态
      const tx = await petContract?.updateRescueRequestStatus(
        selectedRequest.id,
        updateForm.status,
        updateForm.responderOrgId
      )
      await tx.wait()

      // 刷新救助请求列表
      await fetchRescueRequests()
      handleCloseUpdateDialog()
      setSnackbar({
        open: true,
        message: "更新救助请求状态成功",
        severity: "success",
      })
      setIsLoading(false)
    } catch (error) {
      console.error("更新救助请求状态失败:", error)
      setSnackbar({
        open: true,
        message: "更新救助请求状态失败",
        severity: "error",
      })
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "warning"
      case "in_progress":
        return "info"
      case "completed":
        return "success"
      case "cancelled":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">动物救助请求</Typography>
        <Button
          variant="contained"
          startIcon={<PetsIcon />}
          onClick={handleAddRescueRequest}
        >
          发起救助请求
        </Button>
      </Box>

      {isLoading && rescueRequests.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {rescueRequests.length > 0 ? (
            rescueRequests.map((request) => (
              <Grid item xs={12} md={6} key={request.id}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">
                        救助请求 #{request.id}
                      </Typography>
                      <Chip
                        label={request.status}
                        color={
                          getStatusColor(request.status) as
                            | "warning"
                            | "info"
                            | "success"
                            | "error"
                            | "default"
                        }
                      />
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body1">
                        {request.location}
                      </Typography>
                    </Box>

                    <Typography variant="body1" sx={{ my: 2 }}>
                      {request.description}
                    </Typography>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2" color="textSecondary">
                      响应机构ID: {request.responderOrgId || "暂无"}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                      提交时间: {formatDate(request.timestamp)}
                    </Typography>

                    {isContractDeployer && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={() => handleUpdateRescueRequest(request)}
                        >
                          更新状态
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography align="center">暂无救助请求</Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* 添加救助请求对话框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>发起救助请求</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              name="location"
              label="救助位置"
              fullWidth
              required
              value={rescueForm.location}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="详细描述"
              fullWidth
              required
              multiline
              rows={4}
              value={rescueForm.description}
              onChange={handleChange}
              placeholder="请详细描述动物的情况、需要的帮助等信息"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "提交中..." : "提交"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 更新救助请求状态对话框 */}
      <Dialog
        open={openUpdateDialog}
        onClose={handleCloseUpdateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>更新救助请求状态</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>状态</InputLabel>
              <Select
                name="status"
                value={updateForm.status}
                label="状态"
                onChange={handleUpdateChange as any}
              >
                <MenuItem value="pending">待处理</MenuItem>
                <MenuItem value="in_progress">处理中</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="responderOrgId"
              label="响应机构ID"
              type="number"
              fullWidth
              value={updateForm.responderOrgId}
              onChange={handleUpdateChange as any}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={isLoading}>
            取消
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "更新中..." : "更新"}
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

export default RescueRequests
