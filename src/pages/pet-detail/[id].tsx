import { useRouter } from "next/router"
import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../../stores/global"
import {
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Alert,
  Box,
  IconButton,
  MobileStepper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from "@mui/material"
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Edit as EditIcon,
} from "@mui/icons-material"
import { addMultipleToIpfs } from "../../utils/ipfs"
import { Pet, PetAdoptionStatus, PetHealthStatus } from "../../stores/types" // 引入 Pet 类型和相关枚举

const PetDetailPage = observer(() => {
  const router = useRouter()
  const { id: petIdString } = router.query // 从 URL 获取宠物 ID 字符串
  const { petContract, walletAddress, initContract, updatePet } =
    useGlobalStore() // 从 MobX store 获取数据和方法
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0) // 当前显示的图片索引
  const [openDialog, setOpenDialog] = useState(false) // 编辑对话框状态
  const [isUploading, setIsUploading] = useState(false) // 上传状态
  const [mediaFiles, setMediaFiles] = useState<File[]>([]) // 多媒体文件
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]) // 多媒体预览
  const [mediaTypes, setMediaTypes] = useState<string[]>([]) // 媒体类型
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  // 表单状态
  const [petForm, setPetForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    age: "",
    description: "",
    healthStatus: PetHealthStatus.Healthy,
    adoptionStatus: PetAdoptionStatus.NotAvailable,
  })

  useEffect(() => {
    const fetchPetDetails = async () => {
      if (petIdString && typeof petIdString === "string" && petContract) {
        setLoading(true)
        setError(null)
        try {
          const petId = parseInt(petIdString, 10)
          if (isNaN(petId)) {
            setError("无效的宠物ID格式")
            setLoading(false)
            return
          }
          const fetchedPet = await petContract.getPetById(petId)

          if (fetchedPet && fetchedPet.id > 0) {
            setPet({
              id: Number(fetchedPet.id),
              name: fetchedPet.name,
              species: fetchedPet.species,
              breed: fetchedPet.breed,
              gender: fetchedPet.gender,
              age: Number(fetchedPet.age),
              description: fetchedPet.description,
              images: fetchedPet.images || [],

              image:
                fetchedPet.images && fetchedPet.images.length > 0
                  ? fetchedPet.images
                  : "",
              healthStatus: fetchedPet.healthStatus as PetHealthStatus,
              adoptionStatus: fetchedPet.adoptionStatus as PetAdoptionStatus,
              owner: fetchedPet.owner,
              medicalRecordIds: fetchedPet.medicalRecordIds.map((id: any) =>
                Number(id)
              ),
              lastUpdatedAt: Number(fetchedPet.lastUpdatedAt),
            })

            // 初始化表单数据
            setPetForm({
              name: fetchedPet.name,
              species: fetchedPet.species,
              breed: fetchedPet.breed,
              gender: fetchedPet.gender,
              age: Number(fetchedPet.age).toString(),
              description: fetchedPet.description,
              healthStatus: fetchedPet.healthStatus as PetHealthStatus,
              adoptionStatus: fetchedPet.adoptionStatus as PetAdoptionStatus,
            })
          } else {
            setError("未找到该宠物的信息。")
          }
        } catch (err) {
          console.error("获取宠物详情失败:", err)
          setError("获取宠物详情失败，请稍后再试。")
        }
        setLoading(false)
      } else if (petIdString && !petContract) {
        setError("合约未初始化，无法获取宠物数据。")
        setLoading(false)
      }
    }

    fetchPetDetails()
  }, [petIdString, petContract, walletAddress]) // 添加 walletAddress 依赖，确保合约在钱包连接后初始化

  // 处理表单变更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPetForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // 判断文件类型
  const getFileType = (file: File): string => {
    if (file.type.startsWith("image/")) {
      return "image"
    } else if (file.type.startsWith("video/")) {
      return "video"
    } else {
      return "unknown"
    }
  }

  // 处理媒体文件选择
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log("选择的文件:", e.target.files)

      const newFiles = Array.from(e.target.files)
      setMediaFiles([...mediaFiles, ...newFiles])
      // 生成预览和确定媒体类型
      const newPreviews: string[] = []
      const newTypes: string[] = []

      newFiles.forEach((file) => {
        const fileType = getFileType(file)
        newTypes.push(fileType)
        newPreviews.push(URL.createObjectURL(file))
      })

      setMediaPreviews([
        ...mediaPreviews.map((item) => {
          return item.split("-")[0]
        }),
        ...newPreviews.map((item) => {
          return item.split("-")[0]
        }),
      ])
      setMediaTypes([...mediaTypes, ...newTypes])
    }
  }

  // 移除选择的媒体
  const handleRemoveMedia = (index: number) => {
    const newFiles = [...mediaFiles]
    newFiles.splice(index, 1)
    setMediaFiles(newFiles)

    const newPreviews = [...mediaPreviews]
    URL.revokeObjectURL(newPreviews[index]) // 释放URL对象
    newPreviews.splice(index, 1)
    setMediaPreviews(
      newPreviews.map((item) => {
        return item.split("-")[0]
      })
    )

    const newTypes = [...mediaTypes]
    newTypes.splice(index, 1)
    setMediaTypes(newTypes)
  }

  // 打开编辑对话框
  const handleOpenEditDialog = () => {
    // 检查是否是宠物主人
    if (pet && pet.owner.toLowerCase() !== walletAddress.toLowerCase()) {
      setSnackbar({
        open: true,
        message: "只有宠物主人可以编辑宠物信息",
        severity: "error",
      })
      return
    }
    setOpenDialog(true)
  }

  // 关闭编辑对话框
  const handleCloseDialog = () => {
    setOpenDialog(false)
    // 清理预览URL
    mediaPreviews.forEach((url) => URL.revokeObjectURL(url))
    setMediaPreviews([])
    setMediaFiles([])
    setMediaTypes([])
  }

  // 提交更新
  const handleSubmit = async () => {
    if (!pet) return
    try {
      setIsUploading(true)
      // 上传新媒体到IPFS
      let updatedImages = [...(pet.images || [])]
      if (mediaFiles.length > 0) {
        const uploadedUrls = await addMultipleToIpfs(mediaFiles)
        if (uploadedUrls.length > 0) {
          updatedImages = [...updatedImages, ...uploadedUrls]
        }
      }
      // 更新宠物信息
      await updatePet(
        pet.id,
        petForm.name,
        petForm.species,
        petForm.breed,
        petForm.gender,
        parseInt(petForm.age),
        petForm.description,
        updatedImages, // 使用更新后的图片/视频数组
        petForm.healthStatus,
        petForm.adoptionStatus
      )

      // 重新获取宠物信息
      const petId = parseInt(petIdString as string, 10)
      const fetchedPet = await petContract?.getPetById(petId)

      if (fetchedPet && fetchedPet.id > 0) {
        setPet({
          id: Number(fetchedPet.id),
          name: fetchedPet.name,
          species: fetchedPet.species,
          breed: fetchedPet.breed,
          gender: fetchedPet.gender,
          age: Number(fetchedPet.age),
          description: fetchedPet.description,
          images: fetchedPet.images || [],
          image:
            fetchedPet.images && fetchedPet.images.length > 0
              ? fetchedPet.images
              : "",
          healthStatus: fetchedPet.healthStatus as PetHealthStatus,
          adoptionStatus: fetchedPet.adoptionStatus as PetAdoptionStatus,
          owner: fetchedPet.owner,
          medicalRecordIds: fetchedPet.medicalRecordIds.map((id: any) =>
            Number(id)
          ),
          lastUpdatedAt: Number(fetchedPet.lastUpdatedAt),
        })
      }

      setSnackbar({
        open: true,
        message: "宠物信息更新成功",
        severity: "success",
      })

      handleCloseDialog()
    } catch (error: any) {
      console.error("更新宠物信息失败:", error)
      setSnackbar({
        open: true,
        message: error.error || "更新失败，请重试",
        severity: "error",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // 判断URL是图片还是视频
  const getMediaType = (url: string): string => {
    if (url.includes("video")) {
      return "video"
    } else if (url.includes("image")) {
      return "image"
    } else {
      return "unknown"
    }
  }

  // 渲染媒体内容
  const renderMedia = (url: string, index: number) => {
    const mediaType = getMediaType(url)
    const _url = url.split("-")[0]

    if (mediaType === "video") {
      return (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <video
            controls
            autoPlay={activeStep === index}
            loop
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              backgroundColor: "#000",
            }}
          >
            <source src={_url} type="video/mp4" />
            <source src={_url} type="video/webm" />
            <source src={_url} type="video/ogg" />
            您的浏览器不支持视频标签
          </video>
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
              opacity: 0,
              transition: "opacity 0.3s",
              "&:hover": {
                opacity: 1,
              },
            }}
          >
            <Box
              sx={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "24px",
              }}
            >
              ▶
            </Box>
          </Box>
        </Box>
      )
    } else {
      return (
        <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
          <CardMedia
            component="img"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.03)",
              },
            }}
            image={_url || "/images/pet-placeholder.png"}
            alt={`${pet?.name} - 媒体 ${index + 1}`}
          />
        </Box>
      )
    }
  }

  if (loading) {
    return (
      <Container
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="info">No pet data available.</Alert>
      </Container>
    )
  }

  return (
    <>
      <Container maxWidth="md" sx={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <Paper elevation={3} sx={{ padding: "2rem" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ color: "primary.main", margin: 0 }}
            >
              {pet.name} - 宠物详情
            </Typography>
            {pet.owner.toLowerCase() === walletAddress.toLowerCase() && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
              >
                编辑信息
              </Button>
            )}
          </Box>
          <Grid container spacing={3}>
            {pet.images && pet.images.length > 0 ? (
              <Grid item xs={12} md={5}>
                <Card
                  sx={{
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <Box sx={{ position: "relative" }}>
                    <Box
                      sx={{
                        position: "relative",
                        height: "350px",
                        backgroundColor: "#f5f5f5",
                      }}
                    >
                      {renderMedia(pet.images[activeStep], activeStep)}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          color: "white",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "0.75rem",
                        }}
                      >
                        {getMediaType(pet.images[activeStep]) === "video"
                          ? "视频"
                          : "图片"}{" "}
                        {activeStep + 1}/{pet.images.length}
                      </Box>
                    </Box>

                    {pet.images.length > 1 && (
                      <Box>
                        <MobileStepper
                          steps={pet.images.length}
                          position="static"
                          activeStep={activeStep}
                          sx={{
                            backgroundColor: "#f8f8f8",
                            padding: "8px",
                            "& .MuiMobileStepper-dot": {
                              margin: "0 4px",
                              transition: "all 0.3s",
                            },
                            "& .MuiMobileStepper-dotActive": {
                              backgroundColor: "primary.main",
                              transform: "scale(1.2)",
                            },
                          }}
                          nextButton={
                            <Button
                              size="small"
                              onClick={() =>
                                setActiveStep(
                                  (prevStep) =>
                                    (prevStep + 1) % pet.images.length
                                )
                              }
                              disabled={pet.images.length <= 1}
                              sx={{ minWidth: "40px" }}
                            >
                              <KeyboardArrowRight />
                            </Button>
                          }
                          backButton={
                            <Button
                              size="small"
                              onClick={() =>
                                setActiveStep(
                                  (prevStep) =>
                                    (prevStep - 1 + pet.images.length) %
                                    pet.images.length
                                )
                              }
                              disabled={pet.images.length <= 1}
                              sx={{ minWidth: "40px" }}
                            >
                              <KeyboardArrowLeft />
                            </Button>
                          }
                        />

                        <Box
                          sx={{
                            display: "flex",
                            overflowX: "auto",
                            gap: 1,
                            p: 1,
                            backgroundColor: "#f0f0f0",
                            "&::-webkit-scrollbar": {
                              height: "6px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "rgba(0,0,0,0.2)",
                              borderRadius: "6px",
                            },
                          }}
                        >
                          {pet.images.map((url, idx) => {
                            const _url = url.split("-")[0]
                            return (
                              <Box
                                key={idx}
                                onClick={() => setActiveStep(idx)}
                                sx={{
                                  width: "60px",
                                  height: "60px",
                                  flexShrink: 0,
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                  border:
                                    activeStep === idx
                                      ? "2px solid #1976d2"
                                      : "2px solid transparent",
                                  opacity: activeStep === idx ? 1 : 0.7,
                                  transition: "all 0.2s",
                                  cursor: "pointer",
                                  "&:hover": {
                                    opacity: 1,
                                  },
                                }}
                              >
                                {getMediaType(url) === "video" ? (
                                  <Box
                                    sx={{
                                      position: "relative",
                                      height: "100%",
                                    }}
                                  >
                                    <video
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    >
                                      <source src={_url} />
                                    </video>
                                    <Box
                                      sx={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        backgroundColor: "rgba(0,0,0,0.3)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "white",
                                          fontSize: "18px",
                                        }}
                                      >
                                        ▶
                                      </span>
                                    </Box>
                                  </Box>
                                ) : (
                                  <img
                                    src={_url}
                                    alt={`缩略图 ${idx + 1}`}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>
            ) : null}
            <Grid
              item
              xs={12}
              md={pet.images && pet.images.length > 0 ? 7 : 12}
            >
              <CardContent>
                <Typography variant="h6">
                  名字: {pet.name}{" "}
                  {pet.gender === "公" ? "♂" : pet.gender === "母" ? "♀" : ""}
                </Typography>
                <Typography variant="body1">种类: {pet.species}</Typography>
                <Typography variant="body1">
                  品种: {pet.breed || "未知品种"}
                </Typography>
                <Typography variant="body1">年龄: {pet.age} 岁</Typography>
                <Typography variant="body1">
                  健康状况: {PetHealthStatus[pet.healthStatus]}
                </Typography>
                <Typography variant="body1">
                  领养状态: {PetAdoptionStatus[pet.adoptionStatus]}
                </Typography>
                <Typography variant="body1" sx={{ wordBreak: "break-all" }}>
                  主人地址: {pet.owner}
                </Typography>
                {pet.description && (
                  <Typography variant="body1" sx={{ mt: 2 }}>
                    描述: {pet.description}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{ mt: 1, color: "text.secondary" }}
                >
                  最后更新时间:{" "}
                  {new Date(Number(pet.lastUpdatedAt) * 1000).toLocaleString()}
                </Typography>
              </CardContent>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>编辑宠物信息</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                当前媒体文件
              </Typography>
              {pet.images && pet.images.length > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    p: 2,
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    backgroundColor: "rgba(0,0,0,0.01)",
                  }}
                >
                  {pet.images.map((url, index) => {
                    const mediaType = getMediaType(url)
                    const _url = url.split("-")[0]
                    return (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          width: 150,
                          height: 150,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          borderRadius: "8px",
                          overflow: "hidden",
                          transition: "transform 0.2s",
                          "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          },
                        }}
                      >
                        {mediaType === "video" ? (
                          <>
                            <video
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              controls
                            >
                              <source src={_url} />
                            </video>
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                color: "white",
                                padding: "4px 8px",
                                fontSize: "12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>视频 #{index + 1}</span>
                            </Box>
                          </>
                        ) : (
                          <>
                            <img
                              src={_url}
                              alt={`宠物媒体 ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onClick={() => setActiveStep(index)}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: "rgba(0,0,0,0.5)",
                                color: "white",
                                padding: "4px 8px",
                                fontSize: "12px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>图片 #{index + 1}</span>
                            </Box>
                          </>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    border: "1px dashed #ccc",
                    borderRadius: "8px",
                    textAlign: "center",
                    backgroundColor: "rgba(0,0,0,0.02)",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    暂无媒体文件，请添加图片或视频来展示您的宠物
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                添加新媒体文件
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <input
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  id="pet-media-upload"
                  multiple
                  type="file"
                  onChange={handleMediaChange}
                />
                <label htmlFor="pet-media-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={
                      <span role="img" aria-label="upload">
                        📁
                      </span>
                    }
                  >
                    选择图片或视频
                  </Button>
                </label>
                <Typography variant="body2" color="text.secondary">
                  支持图片(jpg, png, gif等)和视频(mp4, webm等)格式
                </Typography>
              </Box>

              {mediaPreviews.length > 0 ? (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                    已选择 {mediaPreviews.length}{" "}
                    个文件，上传后将添加到宠物媒体库
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      p: 2,
                      border: "1px dashed #ccc",
                      borderRadius: "8px",
                      backgroundColor: "rgba(0,0,0,0.02)",
                    }}
                  >
                    {mediaPreviews.map((preview, index) => {
                      console.log(preview, "preview")

                      return (
                        <Box
                          key={index}
                          sx={{
                            position: "relative",
                            width: 120,
                            height: 120,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          {mediaTypes[index] === "video" ? (
                            <>
                              <video
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                controls
                              >
                                <source src={preview} />
                              </video>
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  color: "white",
                                  padding: "2px 4px",
                                  fontSize: "12px",
                                  textAlign: "center",
                                }}
                              >
                                视频
                              </Box>
                            </>
                          ) : (
                            <>
                              <img
                                src={preview}
                                alt={`新媒体 ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  color: "white",
                                  padding: "2px 4px",
                                  fontSize: "12px",
                                  textAlign: "center",
                                }}
                              >
                                图片
                              </Box>
                            </>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveMedia(index)}
                            sx={{
                              position: "absolute",
                              top: 5,
                              right: 5,
                              backgroundColor: "rgba(255,0,0,0.7)",
                              color: "white",
                              width: "20px",
                              height: "20px",
                              "&:hover": {
                                backgroundColor: "rgba(255,0,0,0.9)",
                              },
                            }}
                          >
                            ×
                          </IconButton>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  请选择要上传的图片或视频文件
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="宠物名称"
                name="name"
                value={petForm.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="物种"
                name="species"
                value={petForm.species}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="品种"
                name="breed"
                value={petForm.breed}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="性别"
                name="gender"
                value={petForm.gender}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="年龄"
                name="age"
                type="number"
                value={petForm.age}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                name="description"
                value={petForm.description}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isUploading}
          >
            {isUploading ? "上传中..." : "保存"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
})

export default PetDetailPage
