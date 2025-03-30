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
  CircularProgress,
  Divider,
  CardMedia,
  InputAdornment,
  Tabs,
  Tab,
} from "@mui/material"
import {
  LocalHospital as HospitalIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import WalletConfirmationGuide from "../components/WalletConfirmationGuide"
import { Pet, MedicalEvent } from "../stores/types"

const MedicalRecords: React.FC = observer(() => {
  const {
    userInfo,
    isLoading,
    getUserPets,
    getAllPets,
    walletAddress,
    contract,
    addMedicalEvent,
    getPetMedicalHistory,
    getInstitutionDetail,
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
    cost: 0,
    attachments: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [userSOrg, setUserSOrg] = useState({})
  const [staffStatus, setStaffStatus] = useState({
    isStaff: Number(userInfo?.roleId) === 2,
    institutionId: Number(userInfo?.orgId),
    institutionName: "",
  })

  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!contract || !walletAddress) return
      try {
        const institutionId = await contract.staffToInstitution(walletAddress)
        if (institutionId > 0) {
          const institution = await contract.getInstitutionDetail(institutionId)
          if (Number(institution.institutionType) === 0) {
            // Hospital type
            setStaffStatus({
              isStaff: true,
              institutionId: institutionId,
              institutionName: institution.name,
            })
          }
        }
        const org = await getInstitutionDetail(userInfo?.orgId!)
        if (org) {
          setUserSOrg(org)
          setStaffStatus({
            isStaff: Number(userInfo?.orgId) === 2,
            institutionId: Number(userInfo?.orgId),
            institutionName: org.name,
          })
        }
      } catch (error) {
        console.error("检查员工状态失败:", error)
      }
    }
    checkStaffStatus()
  }, [contract, walletAddress])

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const userPets = await getUserPets()
        setPets(userPets)
        const allPetsList = await getAllPets()
        console.log("pet", allPetsList)
        setAllPets(allPetsList)
      } catch (error) {
        console.error("获取宠物列表失败:", error)
        setSnackbar({
          open: true,
          message: "获取宠物列表失败",
          severity: "error",
        })
      }
    }
    fetchPets()
  }, [activeTab, staffStatus.isStaff])

  const handleSelectPet = async (pet: Pet) => {
    setSelectedPet(pet)
    try {
      const events = await getPetMedicalHistory(pet.id)
      setMedicalEvents(events)
    } catch (error) {
      console.error("获取医疗记录失败:", error)
      setSnackbar({
        open: true,
        message: "获取医疗记录失败",
        severity: "error",
      })
    }
  }

  const handleOpenDialog = () => {
    if (!selectedPet) {
      setSnackbar({
        open: true,
        message: "请先选择一个宠物",
        severity: "warning",
      })
      return
    }
    if (Number(userInfo?.roleId) === 2 || Number(userInfo?.roleId) === 0) {
      setMedicalForm({
        diagnosis: "",
        treatment: "",
        cost: 0,
        attachments: [],
      })
      setOpenDialog(true)
      return
    } else {
      setSnackbar({
        open: true,
        message: "只有医院工作人员或系统管理员才能添加医疗记录",
        severity: "error",
      })
    }
  }

  const handleSubmit = async () => {
    if (!selectedPet) return
    const { diagnosis, treatment, cost, attachments } = medicalForm
    if (!diagnosis || !treatment) {
      setSnackbar({
        open: true,
        message: "请填写完整的诊断和治疗信息",
        severity: "warning",
      })
      return
    }
    try {
      setIsSubmitting(true)
      await addMedicalEvent(
        selectedPet.id,
        diagnosis,
        treatment,
        cost,
        attachments
      )
      const events = await getPetMedicalHistory(selectedPet.id)
      setMedicalEvents(events)
      setOpenDialog(false)
      setSnackbar({
        open: true,
        message: "医疗记录添加成功",
        severity: "success",
      })
    } catch (error: any) {
      console.error("添加医疗记录失败:", error)
      setSnackbar({
        open: true,
        message: error.message || "添加医疗记录失败",
        severity: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(Number(timestamp) * 1000).toLocaleString("zh-CN")
  }

  const filteredPets = (activeTab === 0 ? pets : allPets).filter(
    (pet) =>
      !searchTerm ||
      pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(pet.id).includes(searchTerm)
  )

  console.log(filteredPets)

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">医疗记录⚕️</Typography>
        {Number(userInfo?.roleId) === 2 && (
          <Typography variant="subtitle1" color="primary">
            所属医院:🏥 {staffStatus.institutionName}(ID:
            {staffStatus.institutionId})
          </Typography>
        )}
      </Box>
      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value)}
        sx={{ mb: 3 }}
      >
        <Tab label="我的宠物" />
        {(Number(userInfo?.roleId) === 2 || Number(userInfo?.roleId) === 0) && (
          <Tab label="所有宠物" />
        )}
      </Tabs>

      {activeTab === 1 && (
        <TextField
          fullWidth
          placeholder="搜索宠物（ID、名称、种类、品种）"
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
            宠物列表
          </Typography>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredPets.length > 0 ? (
            <Grid container spacing={2}>
              {filteredPets.map((pet) => (
                <Grid item xs={12} sm={6} key={pet.id}>
                  <Card
                    onClick={() => handleSelectPet(pet)}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.2s",
                      "&:hover": { transform: "translateY(-5px)" },
                      border:
                        selectedPet?.id === pet.id
                          ? "2px solid #1976d2"
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
                      <Typography variant="body2" color="text.secondary">
                        ID: {Number(pet.id)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {pet.species} / {pet.breed} / {pet.gender} /
                        {Number(pet.age)}岁/{" "}
                        {Number(pet.healthStatus) === 0 && "健康"}
                        {Number(pet.healthStatus) === 1 && "生病"}
                        {Number(pet.healthStatus) === 2 && "康复中"}
                      </Typography>
                      <Typography variant="body2">
                        {`${pet.owner.slice(0, 5)}...${pet.owner.slice(-4)}`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography>暂无宠物数据</Typography>
          )}
        </Grid>

        <Grid item xs={12} md={7}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6">
              {selectedPet && String(selectedPet?.name) + "的"}
              医疗记录 {selectedPet && "ID:" + String(selectedPet?.id)}
            </Typography>
            {selectedPet &&
              (Number(userInfo?.roleId) === 2 ||
                Number(userInfo?.roleId) === 0) && (
                <Button
                  variant="contained"
                  startIcon={<HospitalIcon />}
                  onClick={handleOpenDialog}
                >
                  添加记录
                </Button>
              )}
          </Box>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedPet ? (
            medicalEvents.length > 0 ? (
              medicalEvents.map((event, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">
                      诊断: {event.diagnosis}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      治疗方案: {event.treatment}
                    </Typography>
                    <Typography variant="body1" color="primary" sx={{ mt: 1 }}>
                      费用: ¥{Number(event.cost)}
                    </Typography>
                    {event.attachments.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          附件: {event.attachments.length}个文件
                        </Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      医院ID: {Number(event.hospital)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      医生: {event.doctor}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      时间: {formatDate(event.timestamp)}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography>暂无医疗记录</Typography>
            )
          ) : (
            <Typography>请选择一个宠物查看医疗记录</Typography>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加医疗记录</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="诊断"
            value={medicalForm.diagnosis}
            onChange={(e) =>
              setMedicalForm({ ...medicalForm, diagnosis: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="治疗方案"
            value={medicalForm.treatment}
            onChange={(e) =>
              setMedicalForm({ ...medicalForm, treatment: e.target.value })
            }
            margin="normal"
            multiline
            rows={4}
            required
          />
          <TextField
            fullWidth
            label="费用"
            type="number"
            value={medicalForm.cost}
            onChange={(e) =>
              setMedicalForm({ ...medicalForm, cost: Number(e.target.value) })
            }
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">¥</InputAdornment>
              ),
            }}
          />
          <Button
            startIcon={<AttachFileIcon />}
            sx={{ mt: 2 }}
            onClick={() => {
              // TODO: 实现文件上传功能
              setSnackbar({
                open: true,
                message: "文件上传功能开发中",
                severity: "info",
              })
            }}
          >
            添加附件
          </Button>

          {isSubmitting && (
            <WalletConfirmationGuide actionName="添加医疗记录" />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isSubmitting}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? "提交中..." : "确认添加"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default MedicalRecords
