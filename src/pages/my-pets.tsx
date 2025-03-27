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
  CardMedia,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material"
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import { addToIpfs } from "../utils/ipfs"

interface Pet {
  id: number
  name: string
  species: string
  breed: string
  gender: string
  age: number
  description: string
  image: string
  displayImage?: string // 添加用于显示的图片URL
}

const MyPets: React.FC = observer(() => {
  const { userInfo, getUserPets, addPet, updatePet, removePet, walletAddress } =
    useGlobalStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [petForm, setPetForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    age: "",
    description: "",
    imageUrl: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // 当用户信息加载完成后，获取用户的宠物列表
    if (userInfo) {
      fetchPets()
    }
  }, [userInfo])

  // 修改处理页面刷新的 useEffect
  useEffect(() => {
    // 页面加载或刷新时，如果有钱包地址但没有用户信息，尝试获取宠物列表
    const loadPetsOnRefresh = async () => {
      try {
        if (walletAddress && (!pets.length || !userInfo)) {
          console.log("页面刷新或初始加载，尝试获取宠物列表")
          await fetchPets()
        }
      } catch (error) {
        console.error("获取宠物列表失败:", error)
      }
    }

    loadPetsOnRefresh()
  }, [walletAddress, pets.length, userInfo]) // 添加更多依赖项以确保正确触发

  // // 处理本地存储的图片URL
  // useEffect(() => {
  //   const processLocalImages = async () => {
  //     if (pets.length === 0) return

  //     const updatedPets = await Promise.all(
  //       pets.map(async (pet) => {
  //         // 如果图片URL以'local:'开头，从IndexedDB获取实际的Blob URL
  //         if (pet.image && pet.image.startsWith("local:")) {
  //           try {
  //             const imageId = pet.image.substring(6) // 去掉'local:'前缀
  //             return { ...pet, displayImage: blobUrl }
  //           } catch (error) {
  //             console.error("获取本地图片失败:", error)
  //             return { ...pet, displayImage: "/images/pet-placeholder.png" }
  //           }
  //         }
  //         return { ...pet, displayImage: pet.image }
  //       })
  //     )

  //     setPets(updatedPets)
  //   }

  //   processLocalImages()
  // }, [pets.length])

  const fetchPets = async () => {
    try {
      console.log("开始获取宠物列表")
      setIsLoading(true)

      // 如果钱包地址不存在，提前返回
      if (!walletAddress) {
        console.log("钱包地址不存在，无法获取宠物列表")
        return
      }

      const petList = await getUserPets()
      console.log("获取到宠物列表:", petList)
      setPets(petList)
    } catch (error) {
      console.error("获取宠物列表失败:", error)
      setSnackbar({
        open: true,
        message: "获取宠物列表失败",
        severity: "error",
      })
    } finally {
      console.log("获取宠物列表完成")
      setIsLoading(false)
    }
  }

  const handleAddPet = () => {
    setSelectedPet(null)
    setPetForm({
      name: "",
      species: "",
      breed: "",
      gender: "",
      age: "",
      description: "",
      imageUrl: "",
    })
    setImagePreview("")
    setOpenDialog(true)
  }

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet)
    setPetForm({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      gender: pet.gender,
      age: pet.age.toString(),
      description: pet.description,
      imageUrl: pet.image,
    })
    setImagePreview(pet.image)
    setOpenDialog(true)
  }

  const handleDeletePet = async (petId: number) => {
    if (window.confirm("确定要解除与该宠物的关系吗？")) {
      try {
        await removePet(petId)
        await fetchPets()
        setSnackbar({
          open: true,
          message: "解除关系成功",
          severity: "success",
        })
      } catch (error) {
        setSnackbar({
          open: true,
          message: "操作失败，请重试",
          severity: "error",
        })
      }
    }
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedPet(null)
    setPetForm({
      name: "",
      species: "",
      breed: "",
      gender: "",
      age: "",
      description: "",
      imageUrl: "",
    })
    setImagePreview("")
    setImageFile(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPetForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0]
  //   if (file) {
  //     setImageFile(file)
  //     const reader = new FileReader()
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result as string)
  //     }
  //     reader.readAsDataURL(file)
  //   }
  // }

  // 提交表单
  const handleSubmit = async () => {
    try {
      if (
        !petForm.name ||
        !petForm.species ||
        !petForm.gender ||
        !petForm.age
      ) {
        setSnackbar({
          open: true,
          message: "请填写必填字段",
          severity: "error",
        })
        return
      }
      let imageUrl = petForm.imageUrl
      if (imageFile) {
        try {
          setIsUploading(true)
          // 使用 addToIpfs 函数上传图片
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
            message: "上传图片失败，请重试1",
            severity: "error",
          })
          return
        } finally {
          setIsUploading(false)
        }
      }
      if (selectedPet) {
        await updatePet(
          selectedPet.id,
          petForm.name,
          petForm.species,
          petForm.breed,
          petForm.gender,
          parseInt(petForm.age),
          petForm.description,
          imageUrl
        )
      } else {
        await addPet(
          petForm.name,
          petForm.species,
          petForm.breed,
          petForm.gender,
          parseInt(petForm.age),
          petForm.description,
          imageUrl
        )
      }
      await fetchPets()
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: selectedPet ? "修改成功" : "添加成功",
        severity: "success",
      })
    } catch (error) {
      console.log("error", error)
      setSnackbar({
        open: true,
        message: "操作失败，请重试",
        severity: "error",
      })
    }
  }
  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">我的宠物</Typography>
        <Button variant="contained" onClick={handleAddPet}>
          添加宠物
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {pets.map((pet: Pet) => (
            <Grid item xs={12} sm={6} md={4} key={`pet-${pet.id}`}>
              <Card
                sx={{
                  position: "relative",
                  height: 320,
                  overflow: "hidden",
                  borderRadius: "16px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  background:
                    "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
                  },
                }}
              >
                <CardMedia
                  component="img"
                  height="320"
                  image={pet.image || "/images/pet-placeholder.png"}
                  alt={pet.name}
                  sx={{
                    objectFit: "cover",
                    height: "100%",
                    borderRadius: "16px",
                    filter: "brightness(0.9)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background:
                      "linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.3) 100%)",
                    pointerEvents: "none",
                  }}
                />
                <CardContent
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    width: "100%",
                    padding: "16px !important",
                    background: "rgba(255, 255, 255, 0.8)",
                    backdropFilter: "blur(16px)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 -4px 10px rgba(0,0,0,0.05)",
                    borderRadius: "0 0 16px 16px",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      sx={{
                        color: "#3a3a3a",
                        fontSize: "1.2rem",
                        textShadow: "0 1px 1px rgba(255,255,255,0.7)",
                      }}
                    >
                      {pet.name}
                      {pet.gender === "公"
                        ? " ♂"
                        : pet.gender === "母"
                          ? " ♀"
                          : ""}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditPet(pet)}
                        sx={{
                          color: "#555",
                          backgroundColor: "rgba(255,255,255,0.4)",
                          padding: "4px",
                          marginRight: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.7)",
                          },
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletePet(pet.id)}
                        sx={{
                          color: "#d32f2f",
                          backgroundColor: "rgba(255,255,255,0.4)",
                          padding: "4px",
                          "&:hover": {
                            backgroundColor: "rgba(255,255,255,0.7)",
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "4px 12px",
                      mt: 0.5,
                      "& .pet-tag": {
                        backgroundColor: "rgba(255,255,255,0.6)",
                        borderRadius: "12px",
                        padding: "2px 8px",
                        fontSize: "0.75rem",
                        color: "#555",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      },
                    }}
                  >
                    <span className="pet-tag">
                      <span style={{ color: "#888", fontSize: "0.7rem" }}>
                        ID:
                      </span>{" "}
                      {String(pet.id)}
                    </span>
                    <span className="pet-tag">{pet.species}</span>
                    <span className="pet-tag">{pet.breed || "未知品种"}</span>
                    <span className="pet-tag">{String(pet.age)}岁</span>
                  </Box>
                  {pet.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: "#555",
                        fontStyle: "italic",
                        fontSize: "0.8rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      "{pet.description}"
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedPet ? "编辑宠物信息" : "添加新宠物"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
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
                  height: 200,
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
                {!imagePreview && <Typography>点击上传宠物图片</Typography>}
              </Box>
            </label>

            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="宠物名称"
              fullWidth
              required
              value={petForm.name}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="species"
              label="物种"
              fullWidth
              required
              value={petForm.species}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="breed"
              label="品种"
              fullWidth
              value={petForm.breed}
              onChange={handleChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>性别</InputLabel>
              <Select
                name="gender"
                value={petForm.gender}
                label="性别"
                onChange={(e) =>
                  handleChange(
                    e as unknown as React.ChangeEvent<HTMLInputElement>
                  )
                }
                required
              >
                <MenuItem value="公">公</MenuItem>
                <MenuItem value="母">母</MenuItem>
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
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="描述"
              fullWidth
              multiline
              rows={4}
              value={petForm.description}
              onChange={handleChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isUploading}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : null}
          >
            {isUploading ? "上传中..." : selectedPet ? "保存" : "添加"}
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

export default MyPets
