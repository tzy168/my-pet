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
  Chip,
  Tabs,
  Tab,
  InputAdornment,
} from "@mui/material"
import {
  Pets as PetsIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material"
import styles from "../styles/MyPets.module.css"
import {
  Pet,
  PetAdoptionStatus,
  PetHealthStatus,
  RoleType,
  InstitutionType,
} from "../stores/types"

const AdoptionMarket: React.FC = observer(() => {
  const {
    userInfo,
    isLoading,
    updatePetAdoptionStatus,
    walletAddress,
    contract,
    petContract,
    getPetById,
    addAdoptionEvent,
    // getPetsByAdoptionStatus,
  } = useGlobalStore()

  const [pets, setPets] = useState<Pet[]>([])
  const [filteredPets, setFilteredPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  })
  const [staffStatus, setStaffStatus] = useState({
    isShelterStaff: false,
    institutionId: 0,
    institutionName: "",
  })

  useEffect(() => {
    const checkStaffStatus = async () => {
      if (!contract || !walletAddress) return
      try {
        const institutionId = await contract.staffToInstitution(walletAddress)
        if (institutionId > 0) {
          const institution = await contract.getInstitutionDetail(institutionId)
          if (Number(institution.institutionType) === InstitutionType.Shelter) {
            // 救助站类型
            setStaffStatus({
              isShelterStaff: true,
              institutionId: institutionId,
              institutionName: institution.name,
            })
          }
        }
      } catch (error) {
        console.error("检查员工状态失败:", error)
      }
    }
    checkStaffStatus()
  }, [contract, walletAddress])

  useEffect(() => {
    fetchPets()
  }, [activeTab])

  useEffect(() => {
    if (pets.length > 0) {
      filterPets()
    }
  }, [searchTerm, pets, activeTab])

  const fetchPets = async () => {
    try {
      // setIsLoading(true)y
      const availablePets = await petContract?.getPetsByAdoptionStatus(
        Number(PetAdoptionStatus.Available)
      )
      if (availablePets) {
        setPets(availablePets)
      }
    } catch (error) {
      console.error("获取宠物列表失败:", error)
      setSnackbar({
        open: true,
        message: "获取宠物列表失败",
        severity: "error",
      })
    }
  }

  const filterPets = () => {
    let filtered = [...pets]

    // 根据标签筛选
    if (activeTab === 0) {
      // 可领养标签 - 只显示可领养的宠物
      filtered = filtered.filter(
        (pet) => Number(pet.adoptionStatus) === PetAdoptionStatus.Available
      )
    } else if (activeTab === 1) {
      // 处理中标签 - 只显示处理中的宠物
      filtered = filtered.filter(
        (pet) => Number(pet.adoptionStatus) === PetAdoptionStatus.Processing
      )
    } else if (activeTab === 2 && staffStatus.isShelterStaff) {
      // 我的上架 - 只显示该救助站上架的宠物（仅救助站工作人员可见）
      filtered = filtered.filter(
        (pet) => pet.owner.toLowerCase() === walletAddress.toLowerCase()
      )
    }

    // 根据搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(pet.id).includes(searchTerm)
      )
    }

    setFilteredPets(filtered)
  }

  const handleSelectPet = async (pet: Pet) => {
    try {
      const petDetail = await getPetById(pet.id)
      setSelectedPet(petDetail)
    } catch (error) {
      console.error("获取宠物详情失败:", error)
      setSnackbar({
        open: true,
        message: "获取宠物详情失败",
        severity: "error",
      })
    }
  }

  const handleOpenDialog = (pet: Pet) => {
    setSelectedPet(pet)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedPet(null)
  }

  const handleUpdateAdoptionStatus = async (status: PetAdoptionStatus) => {
    if (!selectedPet) return

    try {
      const result = await updatePetAdoptionStatus(selectedPet.id, status)
      if (result.success) {
        setSnackbar({
          open: true,
          message: "更新领养状态成功",
          severity: "success",
        })
        await fetchPets()
        handleCloseDialog()
      } else {
        setSnackbar({
          open: true,
          message: "更新领养状态失败",
          severity: "error",
        })
      }
    } catch (error: any) {
      console.error("更新领养状态失败:", error)
      setSnackbar({
        open: true,
        message: error.message || "更新领养状态失败",
        severity: "error",
      })
    }
  }

  const getAdoptionStatusText = (status: PetAdoptionStatus) => {
    switch (Number(status)) {
      case PetAdoptionStatus.Available:
        return "可领养"
      case PetAdoptionStatus.Adopted:
        return "已领养"
      case PetAdoptionStatus.Processing:
        return "处理中"
      case PetAdoptionStatus.NotAvailable:
        return "不可领养"
      default:
        return "未知状态"
    }
  }

  const getAdoptionStatusColor = (status: PetAdoptionStatus) => {
    switch (Number(status)) {
      case PetAdoptionStatus.Available:
        return "success"
      case PetAdoptionStatus.Adopted:
        return "default"
      case PetAdoptionStatus.Processing:
        return "warning"
      case PetAdoptionStatus.NotAvailable:
        return "error"
      default:
        return "default"
    }
  }

  const getHealthStatusText = (status: PetHealthStatus) => {
    switch (Number(status)) {
      case PetHealthStatus.Healthy:
        return "健康"
      case PetHealthStatus.Sick:
        return "生病"
      case PetHealthStatus.Recovering:
        return "恢复中"
      case PetHealthStatus.Critical:
        return "危重"
      default:
        return "未知状态"
    }
  }

  const getHealthStatusColor = (status: PetHealthStatus) => {
    switch (Number(status)) {
      case PetHealthStatus.Healthy:
        return "success"
      case PetHealthStatus.Sick:
        return "error"
      case PetHealthStatus.Recovering:
        return "warning"
      case PetHealthStatus.Critical:
        return "error"
      default:
        return "default"
    }
  }

  const handleTabChange = async (value: any) => {
    setActiveTab(value)
    switch (value) {
      case 0:
        const res = await petContract?.getPetsByAdoptionStatus(
          Number(PetAdoptionStatus.Available)
        )
        if (res) {
          setPets(res)
        }
      case 1:
        const availablePets = await petContract?.getPetsByAdoptionStatus(
          Number(PetAdoptionStatus.Available)
        )
        if (availablePets) {
          setPets(availablePets)
        }
    }
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">领养市场🦄</Typography>
        {staffStatus.isShelterStaff && (
          <Typography variant="subtitle1" color="primary">
            所属救助站: {staffStatus.institutionName}(ID:
            {Number(staffStatus.institutionId)})
          </Typography>
        )}
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value) => handleTabChange(value)}
        sx={{ mb: 3 }}
      >
        <Tab label="可领养" />
        <Tab label="处理中" />
        {staffStatus.isShelterStaff ||
          (Number(userInfo?.roleId) === 0 && <Tab label="我的上架" />)}
      </Tabs>

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

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredPets.length > 0 ? (
            filteredPets.map((pet: any) => (
              <Grid item xs={12} sm={6} md={4} key={pet.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.3s",
                    "&:hover": { transform: "translateY(-5px)" },
                    cursor: "pointer",
                  }}
                  onClick={() => handleSelectPet(pet)}
                >
                  <CardMedia
                    component="img"
                    height="200"
                    image={
                      (pet[7][0].split("-")[0] as string) ||
                      "/images/pet-placeholder.png"
                    }
                    alt={pet.name}
                  />
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
                      <Chip
                        label={getAdoptionStatusText(pet.adoptionStatus)}
                        color={
                          getAdoptionStatusColor(pet.adoptionStatus) as
                            | "success"
                            | "warning"
                            | "error"
                            | "default"
                        }
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      ID: {Number(pet.id)}
                    </Typography>
                    <Typography variant="body2">
                      {pet.species} / {pet.breed} / {pet.gender} /{" "}
                      {Number(pet.age)}岁
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                      <Chip
                        label={getHealthStatusText(pet.healthStatus)}
                        color={
                          getHealthStatusColor(pet.healthStatus) as
                            | "success"
                            | "warning"
                            | "error"
                            | "default"
                        }
                        size="small"
                      />
                    </Box>
                    {pet.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          color: "text.secondary",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pet.description}
                      </Typography>
                    )}
                    {staffStatus.isShelterStaff && (
                      <Box sx={{ mt: 2, textAlign: "right" }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenDialog(pet)
                          }}
                        >
                          修改状态
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Typography align="center">
                {activeTab === 0
                  ? "暂无可领养宠物"
                  : activeTab === 1
                    ? "暂无处理中的宠物"
                    : "您尚未上架宠物"}
              </Typography>
            </Grid>
          )}
        </Grid>
      )}

      {/* 宠物详情对话框 */}
      {selectedPet && (
        <Dialog
          open={Boolean(selectedPet) && !openDialog}
          onClose={() => setSelectedPet(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>宠物详情</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: "center", mb: 2 }}>
              <img
                src={selectedPet.image || "/images/pet-placeholder.png"}
                alt={selectedPet.name}
                style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }}
              />
            </Box>
            <Typography variant="h5" gutterBottom>
              {selectedPet.name}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  ID
                </Typography>
                <Typography variant="body1">
                  {Number(selectedPet.id)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  物种
                </Typography>
                <Typography variant="body1">{selectedPet.species}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  品种
                </Typography>
                <Typography variant="body1">
                  {selectedPet.breed || "未知"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  性别
                </Typography>
                <Typography variant="body1">{selectedPet.gender}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  年龄
                </Typography>
                <Typography variant="body1">
                  {Number(selectedPet.age)}岁
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  健康状态
                </Typography>
                <Chip
                  label={getHealthStatusText(selectedPet.healthStatus)}
                  color={
                    getHealthStatusColor(selectedPet.healthStatus) as
                      | "success"
                      | "warning"
                      | "error"
                      | "default"
                  }
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  描述
                </Typography>
                <Typography variant="body1">
                  {selectedPet.description || "暂无描述"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  所有者
                </Typography>
                <Typography variant="body1">
                  {`${selectedPet.owner.slice(0, 6)}...${selectedPet.owner.slice(-4)}`}
                </Typography>
              </Grid>
            </Grid>
            {staffStatus.isShelterStaff && (
              <Box sx={{ mt: 2, textAlign: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setSelectedPet(null)
                    handleOpenDialog(selectedPet)
                  }}
                >
                  修改领养状态
                </Button>
              </Box>
            )}
            {!staffStatus.isShelterStaff &&
              Number(selectedPet.adoptionStatus) ===
                PetAdoptionStatus.Available && (
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<FavoriteIcon />}
                    onClick={() => {
                      // 调用合约的addAdoptionEvent方法进行领养
                      if (walletAddress && selectedPet) {
                        // 确认用户想要领养
                        if (
                          window.confirm(`确定要领养${selectedPet.name}吗？`)
                        ) {
                          // 调用全局状态中的addAdoptionEvent方法
                          const institutionId =
                            selectedPet.owner === walletAddress
                              ? 0
                              : staffStatus.institutionId
                          //
                          addAdoptionEvent(
                            selectedPet.id,
                            walletAddress,
                            "用户通过领养市场领养",
                            institutionId
                          )
                            .then((result) => {
                              if (result.success) {
                                setSnackbar({
                                  open: true,
                                  message: "领养成功！宠物已经是您的了",
                                  severity: "success",
                                })
                                // 关闭对话框并刷新宠物列表
                                setSelectedPet(null)
                                fetchPets()
                              } else {
                                setSnackbar({
                                  open: true,
                                  message: "领养失败，请稍后再试",
                                  severity: "error",
                                })
                              }
                            })
                            .catch((error) => {
                              console.error("领养过程中出错:", error)
                              setSnackbar({
                                open: true,
                                message: "领养过程中出错，请稍后再试",
                                severity: "error",
                              })
                            })
                        }
                      } else {
                        setSnackbar({
                          open: true,
                          message: "请先连接钱包",
                          severity: "warning",
                        })
                      }
                    }}
                  >
                    我想领养
                  </Button>
                </Box>
              )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedPet(null)}>关闭</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* 修改领养状态对话框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>修改领养状态</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedPet?.name} (ID: {Number(selectedPet?.id)})
            </Typography>
            <Typography variant="body1" gutterBottom>
              当前状态:{" "}
              {selectedPet && getAdoptionStatusText(selectedPet.adoptionStatus)}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" gutterBottom>
              选择新的领养状态:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  color="success"
                  onClick={() =>
                    handleUpdateAdoptionStatus(PetAdoptionStatus.Available)
                  }
                  disabled={
                    selectedPet?.adoptionStatus === PetAdoptionStatus.Available
                  }
                >
                  可领养
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  color="warning"
                  onClick={() =>
                    handleUpdateAdoptionStatus(PetAdoptionStatus.Processing)
                  }
                  disabled={
                    selectedPet?.adoptionStatus === PetAdoptionStatus.Processing
                  }
                >
                  处理中
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() =>
                    handleUpdateAdoptionStatus(PetAdoptionStatus.Adopted)
                  }
                  disabled={
                    selectedPet?.adoptionStatus === PetAdoptionStatus.Adopted
                  }
                >
                  已领养
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  color="error"
                  onClick={() =>
                    handleUpdateAdoptionStatus(PetAdoptionStatus.NotAvailable)
                  }
                  disabled={
                    selectedPet?.adoptionStatus ===
                    PetAdoptionStatus.NotAvailable
                  }
                >
                  不可领养
                </Button>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
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

export default AdoptionMarket
