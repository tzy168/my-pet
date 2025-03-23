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
import { uploadToIPFS, getIPFSGatewayUrl } from "../utils/ipfs"

interface Pet {
  id: number
  name: string
  species: string
  breed: string
  gender: string
  age: number
  description: string
  image: string
}

const MyPets: React.FC = observer(() => {
  const { userInfo, getUserPets, addPet, updatePet, removePet } =
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

  useEffect(() => {
    // 当用户信息加载完成后，获取用户的宠物列表
    if (userInfo) {
      fetchPets()
    }
  }, [userInfo])

  const fetchPets = async () => {
    try {
      const petList = await getUserPets()
      setPets(petList)
    } catch (error) {
      console.error("获取宠物列表失败:", error)
      setSnackbar({
        open: true,
        message: "获取宠物列表失败",
        severity: "error",
      })
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

  const handleEditPet = (pet: any) => {
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

  const handleDeletePet = async (petId: any) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

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
          // 上传图片到IPFS
          const cid = await uploadToIPFS(imageFile)
          // 获取IPFS网关URL
          imageUrl = getIPFSGatewayUrl(cid)
          console.log("图片已上传到IPFS:", imageUrl)
          setSnackbar({
            open: true,
            message: "上传成功",
            severity: "success",
          })
          setIsUploading(false)
        } catch (error) {
          // console.error('上传图片到IPFS失败:', error)
          setSnackbar({
            open: true,
            message: "上传图片失败，请重试",
            severity: "error",
          })
          setIsUploading(false)
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

      <Grid container spacing={3}>
        {pets.map((pet: any) => (
          <Grid item xs={12} sm={6} md={4} key={pet.id}>
            <Card>
              {pet.image && (
                <CardMedia
                  component="img"
                  height="200"
                  image={pet.image}
                  alt={pet.name}
                  sx={{ objectFit: "cover" }}
                  onError={(e) => {
                    // 图片加载失败时的处理
                    const target = e.target as HTMLImageElement
                    target.onerror = null // 防止无限循环
                    target.src = "/images/pet-placeholder.png" // 使用默认图片
                  }}
                />
              )}
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">{pet.name}</Typography>
                  <Box>
                    <IconButton size="small" onClick={() => handleEditPet(pet)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeletePet(pet.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography color="textSecondary">{pet.species}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  品种：{pet.breed || "未知"}
                </Typography>
                <Typography variant="body2">性别：{pet.gender}</Typography>
                <Typography variant="body2">年龄：{pet.age}岁</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {pet.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
              onChange={handleImageChange}
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
