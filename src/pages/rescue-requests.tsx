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
  CardMedia,
  Stack,
  Rating,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import {
  Pets as PetsIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
  PriorityHigh as UrgentIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import { addToIpfs } from "../utils/ipfs"
import { RescueRequest, RoleType } from "../stores/types"

// interface RescueRequest {
//   id: number
//   location: string
//   description: string
//   status: string
//   responderOrgId: number
//   timestamp: number
// }

const RescueRequests: React.FC = observer(() => {
  const {
    userInfo,
    petContract,
    walletAddress,
    isContractDeployer,
    getUserRescueRequests,
    getAllRescueRequests,
    addRescueRequest,
    updateRescueRequestStatus,
    contract,
  } = useGlobalStore()
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(
    null
  )
  const [rescueForm, setRescueForm] = useState({
    location: "",
    description: "",
    images: [] as string[],
    urgencyLevel: 1,
  })
  const [updateForm, setUpdateForm] = useState({
    status: "",
    responderOrgId: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [statusTab, setStatusTab] = useState(0) // 添加状态筛选标签页
  const [isShelterStaff, setIsShelterStaff] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })

  useEffect(() => {
    // 当用户信息加载完成后，获取救助请求列表
    if (userInfo) {
      fetchRescueRequests()
    }
  }, [userInfo, activeTab, statusTab])

  useEffect(() => {
    // 检查用户是否为救助站工作人员
    const checkShelterStaffStatus = async () => {
      if (!contract || !walletAddress) return
      try {
        // 检查用户角色
        if (userInfo?.roleId === RoleType.Shelter) {
          setIsShelterStaff(true)
          return
        }

        // 检查用户是否为救助站工作人员
        const institutionId = await contract.staffToInstitution(walletAddress)
        if (institutionId > 0) {
          const institution = await contract.getInstitutionDetail(institutionId)
          if (institution && Number(institution.institutionType) === 1) {
            // 1 = Shelter
            setIsShelterStaff(true)
          }
        }
      } catch (error) {
        console.error("检查救助站工作人员状态失败:", error)
      }
    }

    checkShelterStaffStatus()
  }, [contract, walletAddress, userInfo])

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
      // 根据当前标签页和用户角色获取救助请求数据
      let requests: RescueRequest[] = []
      
      if (activeTab === 0 || !isShelterStaff) {
        // 我的救助请求标签页 - 获取用户自己的救助请求
        requests = await getUserRescueRequests()
      } else if (activeTab === 1 && isShelterStaff) {
        // 所有救助请求标签页 - 只有救助站工作人员可以查看所有请求
        requests = await getAllRescueRequests()
      }
      
      // 根据状态标签筛选请求
      if (statusTab > 0) {
        const statusMap = {
          1: "pending",      // 待处理
          2: "in_progress", // 进行中
          3: "completed",   // 已完成
          4: "cancelled"    // 已取消
        }
        const selectedStatus = statusMap[statusTab as keyof typeof statusMap]
        requests = requests.filter(req => req.status.toLowerCase() === selectedStatus)
      }
      
      setRescueRequests(requests)
    } catch (error) {
      console.error("获取救助请求失败:", error)
      setSnackbar({
        open: true,
        message: "获取救助请求失败",
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRescueRequest = () => {
    setRescueForm({
      location: "",
      description: "",
      images: [],
      urgencyLevel: 1,
    })
    setImagePreview("")
    setImageFile(null)
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
    setImagePreview("")
    setImageFile(null)
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

  const handleUrgencyChange = (newValue: number | null) => {
    setRescueForm((prev) => ({
      ...prev,
      urgencyLevel: newValue || 1,
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

      // 处理图片上传
      let imageUrls = [...rescueForm.images]
      if (imageFile) {
        try {
          setIsUploading(true)
          const uploadedUrl = await addToIpfs(imageFile)
          if (uploadedUrl) {
            imageUrls.push(uploadedUrl)
          }
        } catch (error) {
          console.error("上传图片失败:", error)
          setSnackbar({
            open: true,
            message: "上传图片失败，但您仍可以提交救助请求",
            severity: "warning",
          })
        } finally {
          setIsUploading(false)
        }
      }

      // 使用全局store中的addRescueRequest方法
      const result = await addRescueRequest(
        rescueForm.location,
        rescueForm.description,
        imageUrls,
        rescueForm.urgencyLevel
      )

      if (result && result.success) {
        // 刷新救助请求列表
        await fetchRescueRequests()
        handleCloseDialog()
        setSnackbar({
          open: true,
          message: "添加救助请求成功",
          severity: "success",
        })
      } else {
        setSnackbar({
          open: true,
          message: "添加救助请求失败",
          severity: "error",
        })
      }
    } catch (error: any) {
      console.error("添加救助请求失败:", error)
      setSnackbar({
        open: true,
        message: error.message || "添加救助请求失败",
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSubmit = async () => {
    if (!selectedRequest) return

    try {
      // 使用组件顶层已获取的全局store实例，而不是在函数内部调用useGlobalStore
      await updateRescueRequestStatus(
        selectedRequest.id,
        updateForm.status,
        updateForm.responderOrgId
      )

      // 刷新救助请求列表
      await fetchRescueRequests()
      handleCloseUpdateDialog()
      setSnackbar({
        open: true,
        message: "更新救助请求状态成功",
        severity: "success",
      })
    } catch (error) {
      console.error("更新救助请求状态失败:", error)
      setSnackbar({
        open: true,
        message: "更新救助请求状态失败",
        severity: "error",
      })
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN")
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
  
  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "待处理"
      case "in_progress":
        return "进行中"
      case "completed":
        return "已完成"
      case "cancelled":
        return "已取消"
      default:
        return status
    }
  }

  const getUrgencyLabel = (level: number) => {
    switch (level) {
      case 3:
        return "紧急"
      case 2:
        return "中等"
      case 1:
      default:
        return "普通"
    }
  }

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 3:
        return "error"
      case 2:
        return "warning"
      case 1:
      default:
        return "info"
    }
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">动物救助请求🆘</Typography>
        <Button
          variant="contained"
          startIcon={<PetsIcon />}
          onClick={handleAddRescueRequest}
          size={isMobile ? "small" : "medium"}
        >
          发起救助请求
        </Button>
      </Box>

      {/* 主标签页 - 我的/所有请求 */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant={isMobile ? "fullWidth" : "standard"}
          centered={!isMobile}
        >
          <Tab label="我的救助请求" />
          {isShelterStaff && <Tab label="所有救助请求" />}
        </Tabs>
      </Box>
      
      {/* 状态筛选标签页 */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={statusTab}
          onChange={(_, newValue) => setStatusTab(newValue)}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          centered={!isMobile}
          sx={{ minHeight: "36px" }}
        >
          <Tab label="全部" />
          <Tab label="待处理" />
          <Tab label="进行中" />
          <Tab label="已完成" />
          <Tab label="已取消" />
        </Tabs>
      </Box>

      {isLoading && rescueRequests.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 3}>
          {rescueRequests.length > 0 ? (
            rescueRequests.map((request) => (
              <Grid item xs={12} sm={6} md={6} key={request.id}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        justifyContent: "space-between",
                        alignItems: isMobile ? "flex-start" : "center",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{ mb: isMobile ? 1 : 0 }}
                      >
                        救助请求 #{request.id}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Chip
                          label={getUrgencyLabel(request.urgencyLevel)}
                          color={
                            getUrgencyColor(request.urgencyLevel) as
                              | "error"
                              | "warning"
                              | "info"
                          }
                          size="small"
                          icon={<UrgentIcon />}
                        />
                        <Chip
                          label={getStatusLabel(request.status)}
                          color={
                            getStatusColor(request.status) as
                              | "warning"
                              | "info"
                              | "success"
                              | "error"
                              | "default"
                          }
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant={isMobile ? "body2" : "body1"}>
                        {request.location}
                      </Typography>
                    </Box>

                    <Typography
                      variant={isMobile ? "body2" : "body1"}
                      sx={{ my: 2 }}
                    >
                      {request.description}
                    </Typography>

                    {request.images && request.images.length > 0 && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <ImageIcon
                            fontSize="small"
                            sx={{ mr: 1, verticalAlign: "middle" }}
                          />
                          附件图片:
                        </Typography>
                        <Grid container spacing={1}>
                          {request.images.map((img, index) => (
                            <Grid item xs={4} key={index}>
                              <CardMedia
                                component="img"
                                image={img}
                                alt={`救助图片 ${index + 1}`}
                                sx={{
                                  height: isMobile ? 80 : 100,
                                  borderRadius: 1,
                                }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2" color="text.secondary">
                      响应机构ID: {Number(request.responderOrgId) || "暂无"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      请求人:{" "}
                      {`${request.requester.slice(0, 6)}...${request.requester.slice(-4)}`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      提交时间: {formatDate(request.timestamp)}
                    </Typography>

                    {(isContractDeployer || isShelterStaff) && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
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
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Button
              onClick={handleCloseDialog}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              取消
            </Button>
          )}
          发起救助请求
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus={!isMobile}
              margin="dense"
              name="location"
              label="救助位置"
              fullWidth
              required
              value={rescueForm.location}
              onChange={handleChange}
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
            <TextField
              margin="dense"
              name="description"
              label="详细描述"
              fullWidth
              required
              multiline
              rows={isMobile ? 3 : 4}
              value={rescueForm.description}
              onChange={handleChange}
              placeholder="请详细描述动物的情况、需要的帮助等信息"
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />

            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                紧急程度
              </Typography>
              <Rating
                name="urgencyLevel"
                value={rescueForm.urgencyLevel}
                onChange={(_, newValue) => handleUrgencyChange(newValue)}
                max={3}
                size={isMobile ? "small" : "medium"}
              />
              <Typography variant="caption" color="text.secondary">
                {rescueForm.urgencyLevel === 1 && "普通"}
                {rescueForm.urgencyLevel === 2 && "中等紧急"}
                {rescueForm.urgencyLevel === 3 && "非常紧急"}
              </Typography>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                上传图片
              </Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="rescue-image-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              <label htmlFor="rescue-image-upload">
                <Box
                  sx={{
                    width: "100%",
                    height: isMobile ? 120 : 150,
                    border: "2px dashed #ccc",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    mb: 2,
                    backgroundImage: imagePreview
                      ? `url(${imagePreview})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!imagePreview && (
                    <Typography fontSize={isMobile ? "0.875rem" : "1rem"}>
                      {isMobile ? "点击拍照或上传" : "点击上传图片"}
                    </Typography>
                  )}
                </Box>
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
          {!isMobile && (
            <Button
              onClick={handleCloseDialog}
              disabled={isLoading || isUploading}
            >
              取消
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isLoading || isUploading}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={
              isLoading || isUploading ? (
                <CircularProgress size={isMobile ? 16 : 20} />
              ) : null
            }
          >
            {isLoading || isUploading ? "提交中..." : "提交"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 更新救助请求状态对话框 */}
      <Dialog
        open={openUpdateDialog}
        onClose={handleCloseUpdateDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {isMobile && (
            <Button
              onClick={handleCloseUpdateDialog}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              取消
            </Button>
          )}
          更新救助请求状态
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>状态</InputLabel>
              <Select
                name="status"
                value={updateForm.status}
                label="状态"
                onChange={handleUpdateChange as any}
                sx={{ fontSize: isMobile ? "14px" : "16px" }}
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
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: isMobile ? 2 : 1 }}>
          {!isMobile && (
            <Button onClick={handleCloseUpdateDialog} disabled={isLoading}>
              取消
            </Button>
          )}
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            disabled={isLoading}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            startIcon={
              isLoading ? <CircularProgress size={isMobile ? 16 : 20} /> : null
            }
          >
            {isLoading ? "更新中..." : "更新"}
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
    </Box>
  )
})

export default RescueRequests
