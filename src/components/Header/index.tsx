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
} from "@mui/material"

const Header: React.FC = observer(() => {
  const {
    setWalletAddress,
    isRegistered,
    getUserInfo,
    userInfo,
    isContractDeployer,
    addInstitution,
    isLoading,
    contract,
  } = useGlobalStore()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const [openDialog, setOpenDialog] = useState(false)
  const [institutionData, setInstitutionData] = useState({
    name: "",
    institutionType: 0,
    responsiblePerson: "",
  })
  const [error, setError] = useState<string | null>(null)

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
      setWalletAddress(address || "0x0000000000000000000000000000000000000000")
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
        institutionData.responsiblePerson
      )
      if (success) {
        // 显示成功提示
        alert("添加机构成功！")
        // 关闭对话框
        handleCloseDialog()
      }
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <h2
          className={styles.logo}
          onClick={() => {
            router.push("/")
          }}
        >
          MyPet
        </h2>
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
            }
            return (
              <>
                <ConnectButton />
              </>
            )
          }}
        </ConnectButton.Custom>
        {userInfo && (
          <>
            <div
              className={styles.userName}
              onClick={handleClick}
              style={{ cursor: "pointer" }}
            >
              {isContractDeployer ? "系统管理员" : userInfo[1]}
              {!isContractDeployer && (
                <span
                  className={`${styles.userType} ${userInfo[5] === 0 ? styles.personal : styles.institutional}`}
                >
                  {userInfo[5] === 0 ? `机构用户` : `个人用户`}
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
          {error && <FormHelperText error>{error}</FormHelperText>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  )
})

export default Header
