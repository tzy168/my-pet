import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import { useRouter } from "next/router"
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
  InputAdornment,
} from "@mui/material"
import {
  Pets as PetsIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
  PriorityHigh as UrgentIcon,
  AccountCircle,
  Storefront as StorefrontIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import { addToIpfs } from "../utils/ipfs"
import {
  RescueRequest,
  RoleType,
  PetAdoptionStatus,
  PetHealthStatus,
  Pet,
} from "../stores/types"
import { set } from "mobx"

const RescueRequests: React.FC = observer(() => {
  const router = useRouter()
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
    addPet,
  } = useGlobalStore()
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false)
  const [openPetDialog, setOpenPetDialog] = useState(false) // 添加宠物对话框状态
  const [selectedRequest, setSelectedRequest] = useState<RescueRequest | null>(
    null
  )
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null) // 添加选中宠物状态
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
  // 添加宠物表单状态
  const [petForm, setPetForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    age: "",
    description: "",
    imageUrl: "",
    healthStatus: PetHealthStatus.Healthy,
    adoptionStatus: PetAdoptionStatus.Available,
    lastUpdatedAt: 0,
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
  const [openPushDialog, setOpenPushDialog] = useState(false)

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
        if (Number(userInfo?.roleId) === RoleType.Shelter) {
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
          1: "pending", // 待处理
          2: "in_progress", // 进行中
          3: "completed", // 已完成
          4: "cancelled", // 已取消
        }
        const selectedStatus = statusMap[statusTab as keyof typeof statusMap]
        requests = requests.filter(
          (req) => req.status.toLowerCase() === selectedStatus
        )
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
    setOpenPushDialog(false)
    setOpenDialog(false)
    setImagePreview("")
    setImageFile(null)
    setSelectedPet(null)
  }

  const handleCloseUpdateDialog = () => {
    setOpenUpdateDialog(false)
    setSelectedRequest(null)
  }

  // 处理宠物表单变更
  const handlePetFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPetForm({
      ...petForm,
      [name]: value,
    })
  }

  // 处理宠物表单提交
  const handlePetSubmit = async () => {
    try {
      if (
        !petForm.name ||
        !petForm.species ||
        !petForm.gender ||
        !petForm.age ||
        !userInfo
      ) {
        setSnackbar({
          open: true,
          message: !userInfo ? "请先完成用户注册" : "请填写必填字段",
          severity: "error",
        })
        return
      }

      let imageUrl = petForm.imageUrl
      if (imageFile) {
        try {
          setIsUploading(true)
          const uploadedUrl = await addToIpfs(imageFile)
          imageUrl = uploadedUrl!
          setSnackbar({
            open: true,
            message: "上传成功",
            severity: "success",
          })
        } catch (error) {
          console.log("error", error)
          setSnackbar({
            open: true,
            message: "上传图片失败，请重试",
            severity: "error",
          })
          return
        } finally {
          setIsUploading(false)
          setOpenPushDialog(false)
        }
      }

      // 添加宠物
      await addPet(
        petForm.name,
        petForm.species,
        petForm.breed,
        petForm.gender,
        parseInt(petForm.age),
        petForm.description,
        imageUrl,
        petForm.healthStatus,
        petForm.adoptionStatus
      )

      handleCloseDialog()
      setSnackbar({
        open: true,
        message: "宠物已成功添加到领养市场",
        severity: "success",
      })

      // 可以选择跳转到领养市场页面
      // router.push('/adoption-market')
    } catch (error: any) {
      console.log("error", error)
      setSnackbar({
        open: true,
        message: error.error || "操作失败，请重试",
        severity: "error",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRescueForm({
      ...rescueForm,
      [name]: value,
    })
  }

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUpdateForm({
      ...updateForm,
      [name]: value,
    })
  }

  const handleUrgencyChange = (newValue: number | null) => {
    setRescueForm({
      ...rescueForm,
      urgencyLevel: newValue || 1,
    })
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
      if (Number(userInfo?.roleId) === 3) {
        //如果当前状态与要更新的状态相同，不允许更新
        if (
          updateForm.status.toLowerCase() ===
          selectedRequest.status.toLowerCase()
        ) {
          setSnackbar({
            open: true,
            message: "新状态与当前状态相同，无法更新",
            severity: "error",
          })
          return
        }
        const tx = await updateRescueRequestStatus(
          selectedRequest.id,
          updateForm.status,
          Number(userInfo?.orgId)
        )

        // 刷新救助请求列表
        await fetchRescueRequests()

        handleCloseUpdateDialog()
        setSnackbar({
          open: true,
          message: "更新救助请求状态成功",
          severity: "success",
        })
      } else {
        setSnackbar({
          open: true,
          message: "无权限",
          severity: "error",
        })
        return
      }
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

  // 处理发布到领养市场的函数
  const handlePublishToAdoptionMarket = (request: RescueRequest) => {
    // 将救助请求信息预填充到宠物表单中
    setPetForm({
      name: request.location.split(" ")[0] || "救助宠物", // 使用救助位置的第一个词作为默认名称
      species: "", // 物种需要用户填写
      breed: "", // 品种需要用户填写
      gender: "", // 性别需要用户填写
      age: "1", // 默认年龄为1岁
      description: `这是一个来自救助请求的宠物。\n原始救助描述: ${request.description}\n救助位置: ${request.location}`, // 使用救助请求的描述
      imageUrl:
        request.images && request.images.length > 0 ? request.images[0] : "", // 使用救助请求的第一张图片
      healthStatus: PetHealthStatus.Recovering, // 默认为恢复中
      adoptionStatus: PetAdoptionStatus.Available, // 默认为可领养
      lastUpdatedAt: 0,
    })

    // 如果有图片，设置图片预览
    if (request.images && request.images.length > 0) {
      setImagePreview(request.images[0])
    } else {
      setImagePreview("")
    }

    // 打开添加宠物对话框
    setSelectedPet(null)
    setOpenPushDialog(true)
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
          {(isShelterStaff || Number(userInfo?.roleId) === 0) && (
            <Tab label="所有救助请求" />
          )}
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

                    <Box
                      sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}
                    >
                      {(isContractDeployer || isShelterStaff) && (
                        <Button
                          variant="outlined"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleUpdateRescueRequest(request)}
                        >
                          更新状态
                        </Button>
                      )}

                      {/* 当救助状态为已完成时，显示发布到领养市场按钮 */}
                      {request.status.toLowerCase() === "completed" &&
                        Number(userInfo?.roleId) === 3 && (
                          <Button
                            variant="contained"
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                            startIcon={<StorefrontIcon />}
                            onClick={() =>
                              handlePublishToAdoptionMarket(request)
                            }
                          >
                            发布到领养市场
                          </Button>
                        )}
                    </Box>
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
              placeholder="点击选择位置"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                },
              }}
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
            {/* <TextField
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
            /> */}
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
      {/* 添加宠物对话框 */}
      <Dialog
        open={openPushDialog && selectedRequest === null}
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
          添加宠物到领养市场
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus={!isMobile}
              margin="dense"
              name="name"
              label="宠物名称"
              fullWidth
              required
              value={petForm.name}
              onChange={handlePetFormChange}
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
            <TextField
              margin="dense"
              name="species"
              label="物种"
              fullWidth
              required
              value={petForm.species}
              onChange={handlePetFormChange}
              placeholder="例如：猫、狗、兔子等"
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
            <TextField
              margin="dense"
              name="breed"
              label="品种"
              fullWidth
              value={petForm.breed}
              onChange={handlePetFormChange}
              placeholder="例如：金毛、橘猫等"
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>性别</InputLabel>
              <Select
                name="gender"
                value={petForm.gender}
                label="性别"
                onChange={handlePetFormChange as any}
                sx={{ fontSize: isMobile ? "14px" : "16px" }}
              >
                <MenuItem value="公">公</MenuItem>
                <MenuItem value="母">母</MenuItem>
                <MenuItem value="未知">未知</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="age"
              label="年龄"
              type="number"
              fullWidth
              required
              value={petForm.age}
              onChange={handlePetFormChange}
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />
            <TextField
              margin="dense"
              name="description"
              label="描述"
              fullWidth
              multiline
              rows={isMobile ? 3 : 4}
              value={petForm.description}
              onChange={handlePetFormChange}
              InputProps={{
                style: { fontSize: isMobile ? "14px" : "16px" },
              }}
            />

            <FormControl fullWidth margin="dense">
              <InputLabel>健康状态</InputLabel>
              <Select
                name="healthStatus"
                value={petForm.healthStatus}
                label="健康状态"
                onChange={handlePetFormChange as any}
                sx={{ fontSize: isMobile ? "14px" : "16px" }}
              >
                <MenuItem value={PetHealthStatus.Healthy}>健康</MenuItem>
                <MenuItem value={PetHealthStatus.Sick}>生病</MenuItem>
                <MenuItem value={PetHealthStatus.Recovering}>恢复中</MenuItem>
                <MenuItem value={PetHealthStatus.Critical}>危重</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth margin="dense">
              <InputLabel>领养状态</InputLabel>
              <Select
                name="adoptionStatus"
                value={petForm.adoptionStatus}
                label="领养状态"
                onChange={handlePetFormChange as any}
                sx={{ fontSize: isMobile ? "14px" : "16px" }}
              >
                <MenuItem value={PetAdoptionStatus.Available}>可领养</MenuItem>
                <MenuItem value={PetAdoptionStatus.Adopted}>已领养</MenuItem>
                <MenuItem value={PetAdoptionStatus.Processing}>处理中</MenuItem>
                <MenuItem value={PetAdoptionStatus.NotAvailable}>
                  不可领养
                </MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                宠物图片
              </Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="pet-image-upload"
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
              <label htmlFor="pet-image-upload">
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
            onClick={handlePetSubmit}
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
