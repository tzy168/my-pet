import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import styles from "./styles.module.css"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/router"
import { useGlobalStore } from "../../stores/global"
import Navigation from "../Navigation"
import {
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Snackbar,
  Alert,
} from "@mui/material"

const Header: React.FC = observer(() => {
  const {
    walletAddress,
    setWalletAddress,
    isRegistered,
    getUserInfo,
    userInfo,
    isContractDeployer,
    addInstitution,
    isLoading,
    contract,
  } = useGlobalStore()
  console.log("user", userInfo)

  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const [openDialog, setOpenDialog] = useState(false)
  const [institutionData, setInstitutionData] = useState({
    name: "",
    institutionType: 0,
    responsiblePerson: "",
    address: "",
    concatInfo: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  useEffect(() => {
    // 确保合约已初始化后再获取用户信息
    if (contract) {
      getUserInfo().catch((err) => {
        console.error("获取用户信息失败:", err)
      })
    }
  }, [contract])

  useEffect(() => {
    // 监听钱包地址变化
    const handleAccountChange = (address: string | undefined) => {
      if (address) {
        setWalletAddress(address)
      } else {
        // 当钱包断开连接时，清除钱包地址和用户信息
        setWalletAddress("")
        // 如果全局存储中有清除用户信息的方法，可以在这里调用
        // clearUserInfo()
      }
    }
    return () => {
      handleAccountChange(undefined)
    }
  }, [])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path)
    handleClose()
  }

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setInstitutionData({
      name: "",
      institutionType: 0,
      responsiblePerson: "",
      address: "",
      concatInfo: "",
    })
    setError(null)
  }

  const handleSubmit = async () => {
    try {
      if (!institutionData.name || !institutionData.responsiblePerson) {
        setError("请填写所有必填字段")
        return
      }
      setError(null)
      const success = await addInstitution(
        institutionData.name,
        institutionData.institutionType,
        institutionData.responsiblePerson,
        institutionData.address,
        institutionData.concatInfo
      )
      if (success) {
        setSnackbar({
          open: true,
          message: "添加机构成功！",
          severity: "success",
        })
        handleCloseDialog()
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div
          className={styles.logo}
          onClick={() => {
            router.push("/")
          }}
        >
          MyPet🐾
        </div>
        {<Navigation />}
      </div>
      <div className={styles.rightSection}>
        <ConnectButton.Custom>
          {({ account, chain, authenticationStatus, mounted }) => {
            const ready = mounted && authenticationStatus !== "loading"
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated")

            if (account?.address) {
              setWalletAddress(account.address)
            } else {
              // 当钱包断开连接时，清除钱包地址
              setWalletAddress("")
            }

            return (
              <>
                <ConnectButton />
              </>
            )
          }}
        </ConnectButton.Custom>
        {userInfo && walletAddress && (
          <>
            <div
              className={styles.userName}
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
              {isContractDeployer ? "系统管理员" : userInfo.name}
              {!isContractDeployer && (
                <span
                  className={`${styles.userType} ${userInfo.userType === 0 ? styles.personal : styles.institutional}`}
                >
                  {userInfo.userType === 0 ? "个人用户" : "机构用户"}
                </span>
              )}
            </div>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              {isContractDeployer ? (
                <>
                  <MenuItem onClick={() => handleMenuItemClick("/admin")}>
                    机构管理
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick("/system-info")}>
                    系统信息
                  </MenuItem>
                  <MenuItem onClick={handleOpenDialog}>添加机构</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem onClick={() => handleMenuItemClick("/profile")}>
                    个人信息
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick("/my-pets")}>
                    我的宠物
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        )}
      </div>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>添加新机构</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="机构名称"
            fullWidth
            value={institutionData.name}
            onChange={(e) =>
              setInstitutionData({ ...institutionData, name: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>机构类型</InputLabel>
            <Select
              value={institutionData.institutionType}
              label="机构类型"
              onChange={(e) =>
                setInstitutionData({
                  ...institutionData,
                  institutionType: Number(e.target.value),
                })
              }
            >
              <MenuItem value={0}>宠物医院</MenuItem>
              <MenuItem value={1}>宠物收容所</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="负责人钱包地址"
            fullWidth
            value={institutionData.responsiblePerson}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                responsiblePerson: e.target.value,
              })
            }
          />
          <TextField
            autoFocus
            margin="dense"
            label="地址"
            fullWidth
            value={institutionData.address}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                address: e.target.value,
              })
            }
          />
          <TextField
            autoFocus
            margin="dense"
            label="联系方式"
            fullWidth
            value={institutionData.concatInfo}
            onChange={(e) =>
              setInstitutionData({
                ...institutionData,
                concatInfo: e.target.value,
              })
            }
          />
          {error && <FormHelperText error>{error}</FormHelperText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            添加
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
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </header>
  )
})

export default Header
