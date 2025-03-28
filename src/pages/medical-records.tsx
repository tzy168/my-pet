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
  Tabs,
  Tab,
  CardMedia,
  InputAdornment,
  IconButton,
} from "@mui/material"
import {
  LocalHospital as HospitalIcon,
  Search as SearchIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import { ethers } from "ethers"
import WalletConfirmationGuide from "../components/WalletConfirmationGuide"
import { log } from "util"

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
  const {
    isLoading,
    userInfo,
    getUserPets,
    getAllPets,
    petContract,
    walletAddress,
    setLoading,
    getInstitutionManagerContract,
    addMedicalEvent,
    checkIsHospitalStaff,
    getInstitutionNameById,
  } = useGlobalStore()
  const [activeTab, setActiveTab] = useState(0)
  const [pets, setPets] = useState<Pet[]>([])
  const [allPets, setAllPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [medicalEvents, setMedicalEvents] = useState<MedicalEvent[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [medicalForm, setMedicalForm] = useState({
    diagnosis: "",
    treatment: "",
  })
  const [loading, setIsLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [staffStatus, setStaffStatus] = useState<{
    isStaff: boolean
    message: string
    institutionId?: number
    institutionName?: string
    institutionAddress?: string
  }>({
    isStaff: false,
    message: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const checkStaffStatus = async () => {
      const status = await checkIsHospitalStaff()
      setStaffStatus(status)
      console.log("staff status:", status)
      // 如果不是医院员工(roleId !== 2)，则只显示我的患者标签
      if (!status.isStaff) {
        setActiveTab(0)
      }
    }
    if (walletAddress) {
      checkStaffStatus()
    }
  }, [walletAddress])

  useEffect(() => {
    const fetchAllPets = async () => {
      if (staffStatus.isStaff && activeTab === 1) {
        try {
          setIsLoading(true)
          const allPetsList = await getAllPets()
          setAllPets(allPetsList) // 修正这里，使用过滤后的列表
        } catch (error: any) {
          console.error("获取所有宠物列表失败:", error)
          setSnackbar({
            open: true,
            message: error.message || "获取所有宠物列表失败", // 使用具体的错误信息
            severity: "error",
          })
          // 如果是权限错误，自动切换到"我的患者"标签
          if (error.message?.includes("没有权限")) {
            setActiveTab(0)
          }
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchAllPets()
  }, [staffStatus.isStaff, activeTab])

  useEffect(() => {
    const fetchUserPets = async () => {
      if (walletAddress && activeTab === 0) {
        try {
          setIsLoading(true)
          const userPetsList = await getUserPets()
          setPets(userPetsList)
        } catch (error) {
          console.error("获取用户宠物列表失败:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchUserPets()
  }, [walletAddress, activeTab])

  const fetchPetMedicalEvents = async (petId: number) => {
    try {
      setIsLoading(true)
      const count = await petContract?.getMedicalEventCountByPet(petId)

      if (count > 0) {
        const events = []
        for (let i = 0; i < count; i++) {
          const eventId = await petContract?.getPetMedicalEventAt(petId, i)
          const event = await petContract?.medicalEvents(eventId)
          events.push({
            ...event,
            timestamp: Number(event.timestamp),
            petId: Number(event.petId),
          })
        }
        setMedicalEvents(events)
      } else {
        setMedicalEvents([])
      }
    } catch (error) {
      console.error("获取医疗记录失败:", error)
      setSnackbar({
        open: true,
        message: "获取医疗记录失败",
        severity: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectPet = async (pet: Pet) => {
    setSelectedPet(pet)
    await fetchPetMedicalEvents(pet.id)
  }

  const handleOpenDialog = () => {
    if (!selectedPet) {
      setSnackbar({
        open: true,
        message: "请先选择一个宠物",
        severity: "error",
      })
      return
    }

    // 使用staffStatus.isStaff进行权限控制，该值已经基于roleId进行判断
    if (!staffStatus.isStaff) {
      setSnackbar({
        open: true,
        message: "只有医院工作人员才能添加医疗记录",
        severity: "error",
      })
      return
    }

    setMedicalForm({
      diagnosis: "",
      treatment: "",
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setMedicalForm({
      ...medicalForm,
      [name]: value,
    })
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
      setIsSubmitting(true)
      setSnackbar({
        open: true,
        message: "请在钱包中确认交易以添加医疗记录",
        severity: "info",
      })
      const res = await addMedicalEvent(
        selectedPet.id,
        medicalForm.diagnosis,
        medicalForm.treatment
      )

      handleCloseDialog()
      await fetchPetMedicalEvents(selectedPet.id)
      setSnackbar({
        open: true,
        message: "添加医疗记录成功",
        severity: "success",
      })
    } catch (error) {
      console.error("合约调用错误:", error)
      let errorMessage = "添加医疗记录失败"
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }

  const filteredPets =
    activeTab === 0
      ? pets
      : allPets.filter(
          (pet) =>
            (pet?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              pet?.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              pet?.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              String(pet?.id).includes(searchTerm)) ??
            false
        )

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    setSelectedPet(null)
    setMedicalEvents([])
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">医疗记录</Typography>
        {staffStatus.isStaff && (
          <Typography variant="subtitle1" color="primary">
            医院: {String(staffStatus.institutionName)}
          </Typography>
        )}
      </Box>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="我的宠物" />
        {staffStatus.isStaff && <Tab label="所有宠物" />}
      </Tabs>

      {activeTab === 1 && (
        <TextField
          fullWidth
          placeholder="搜索宠物（名称、种类、品种）"
          margin="normal"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Typography variant="h6" gutterBottom>
            所有宠物列表
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredPets.length > 0 ? (
            <Grid container spacing={2}>
              {filteredPets.map((pet) => (
                <Grid item xs={12} sm={6} key={`pet-${pet.id}`}>
                  <Card
                    onClick={() => handleSelectPet(pet)}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateY(-5px)" },
                      opacity: selectedPet?.id === pet.id ? 1 : 0.8,
                      border:
                        selectedPet?.id === pet.id
                          ? "2px solid #3f51b5"
                          : "none",
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={pet.image || "/images/pet-placeholder.png"}
                      alt={pet.name}
                    />
                    <CardContent>
                      <Typography variant="h6">{pet.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        ID: {String(pet.id)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {pet.species} / {pet.breed} / {pet.gender} /{" "}
                        {String(pet.age)}岁
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>暂无{activeTab === 0 ? "患者" : "宠物"}数据</Typography>
          )}
        </Grid>

        <Grid item xs={12} md={7}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              医疗记录
            </Typography>
            {selectedPet && staffStatus.isStaff && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<HospitalIcon />}
                onClick={handleOpenDialog}
              >
                添加医疗记录
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedPet ? (
            medicalEvents.length > 0 ? (
              <List>
                {medicalEvents.map((event: any, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        诊断: {String(event[1])}
                      </Typography>
                      <Typography variant="body1">
                        治疗: {String(event[2])}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="textSecondary">
                        医院: {Number(event[4])}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        医生: {String(event[5])}
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
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: "block", mt: 2 }}
            >
              注意：医疗记录将使用您的钱包地址作为医生信息，并自动关联到您所属的医院机构。
            </Typography>
            {isSubmitting && (
              <WalletConfirmationGuide actionName="添加医疗记录" />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? "提交中..." : "添加"}
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
