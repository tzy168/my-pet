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
} from "@mui/material"
import { LocalHospital as HospitalIcon } from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"

interface Pet {
  id: number
  name: string
  species: string
  breed: string
  gender: string
  age: number
  description: string
  image: string
  owner: string
}

interface MedicalEvent {
  petId: number
  diagnosis: string
  treatment: string
  timestamp: number
  hospital: string
  doctor: string
}

const MedicalRecords: React.FC = observer(() => {
  const { userInfo, getUserPets, petContract, walletAddress } = useGlobalStore()
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [medicalEvents, setMedicalEvents] = useState<MedicalEvent[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [medicalForm, setMedicalForm] = useState({
    diagnosis: "",
    treatment: "",
    hospital: "",
    doctor: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

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

  const fetchMedicalEvents = async (petId: number) => {
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
      // 从合约获取医疗记录数据
      const events = []

      // 获取所有医疗事件并筛选出与当前宠物相关的记录
      // 注意：由于合约中没有提供获取医疗事件数量的公共方法，我们需要使用try-catch来遍历
      let i = 0
      let hasMore = true

      while (hasMore) {
        try {
          const event = await petContract.medicalEvents(i)
          if (event.petId.toString() === petId.toString()) {
            events.push(event)
          }
          i++
        } catch (error) {
          // 当索引超出范围时，合约会抛出异常，表示没有更多记录
          hasMore = false
        }
      }

      setMedicalEvents(events)
      setIsLoading(false)
    } catch (error) {
      console.error("获取医疗记录失败:", error)
      setSnackbar({
        open: true,
        message: "获取医疗记录失败",
        severity: "error",
      })
      setIsLoading(false)
    }
  }

  const handlePetSelect = (pet: Pet) => {
    setSelectedPet(pet)
    fetchMedicalEvents(pet.id)
  }

  const handleAddMedicalRecord = () => {
    if (!selectedPet) {
      setSnackbar({
        open: true,
        message: "请先选择一个宠物",
        severity: "error",
      })
      return
    }
    setMedicalForm({
      diagnosis: "",
      treatment: "",
      hospital: "",
      doctor: walletAddress, // 默认使用当前钱包地址作为医生地址
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMedicalForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedPet) {
      setSnackbar({
        open: true,
        message: "请先选择一个宠物",
        severity: "error",
      })
      return
    }

    if (!medicalForm.diagnosis || !medicalForm.treatment) {
      setSnackbar({
        open: true,
        message: "请填写诊断和治疗信息",
        severity: "error",
      })
      return
    }

    try {
      setIsLoading(true)
      // 调用合约添加医疗记录
      const tx = await petContract?.addMedicalEvent(
        selectedPet.id,
        medicalForm.diagnosis,
        medicalForm.treatment,
        medicalForm.hospital || walletAddress, // 如果未填写医院地址，使用当前钱包地址
        medicalForm.doctor || walletAddress // 如果未填写医生地址，使用当前钱包地址
      )
      await tx.wait()

      // 刷新医疗记录
      await fetchMedicalEvents(selectedPet.id)
      handleCloseDialog()
      setSnackbar({
        open: true,
        message: "添加医疗记录成功",
        severity: "success",
      })
      setIsLoading(false)
    } catch (error) {
      console.error("添加医疗记录失败:", error)
      setSnackbar({
        open: true,
        message: "添加医疗记录失败",
        severity: "error",
      })
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">宠物医疗记录</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            我的宠物
          </Typography>
          <List>
            {pets.length > 0 ? (
              pets.map((pet) => (
                <Card
                  key={pet.id}
                  sx={{
                    mb: 2,
                    cursor: "pointer",
                    border:
                      selectedPet?.id === pet.id ? "2px solid #1976d2" : "none",
                  }}
                  onClick={() => handlePetSelect(pet)}
                >
                  <CardContent>
                    <Typography variant="h6">{pet.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      ID: {pet.id}
                    </Typography>
                    <Typography color="textSecondary">{pet.species}</Typography>
                    <Typography variant="body2">
                      品种：{pet.breed || "未知"}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography>暂无宠物信息</Typography>
            )}
          </List>
        </Grid>

        <Grid item xs={12} md={8}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              {selectedPet
                ? `${selectedPet.name} 的医疗记录`
                : "请选择宠物查看医疗记录"}
            </Typography>
            {selectedPet && (
              <Button
                variant="contained"
                startIcon={<HospitalIcon />}
                onClick={handleAddMedicalRecord}
              >
                添加医疗记录
              </Button>
            )}
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedPet ? (
            medicalEvents.length > 0 ? (
              <List>
                {medicalEvents.map((event, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold">
                        诊断: {event.diagnosis}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        治疗: {event.treatment}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        医院: {event.hospital}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        医生: {event.doctor}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        时间: {formatDate(event.timestamp)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : (
              <Typography>暂无医疗记录</Typography>
            )
          ) : (
            <Typography>请先选择一个宠物</Typography>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加医疗记录</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              name="diagnosis"
              label="诊断"
              fullWidth
              required
              value={medicalForm.diagnosis}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="treatment"
              label="治疗方案"
              fullWidth
              required
              multiline
              rows={4}
              value={medicalForm.treatment}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              name="hospital"
              label="医院地址（钱包地址）"
              fullWidth
              value={medicalForm.hospital}
              onChange={handleChange}
              placeholder={walletAddress}
              helperText="如不填写，默认使用当前钱包地址"
            />
            <TextField
              margin="dense"
              name="doctor"
              label="医生地址（钱包地址）"
              fullWidth
              value={medicalForm.doctor}
              onChange={handleChange}
              placeholder={walletAddress}
              helperText="如不填写，默认使用当前钱包地址"
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
            {isLoading ? "提交中..." : "添加"}
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

export default MedicalRecords
