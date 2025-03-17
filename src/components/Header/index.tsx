import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import styles from "./styles.module.css"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/router"
import { useGlobalStore } from "../../stores/global"
import { Menu, MenuItem } from "@mui/material"

const Header: React.FC = observer(() => {
  const { setWalletAddress, isRegistered, getUserInfo, userInfo } =
    useGlobalStore()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  useEffect(() => {
    getUserInfo()
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

  return (
    <header className={styles.header}>
      <h2 className={styles.logo}>MyPet</h2>{" "}
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
            useEffect(() => {
              if (connected && isRegistered) {
                router.push("/")
              } else if (!connected) {
                router.push("/login")
              } else if (connected && !isRegistered) {
                router.push("/register")
              }
            }, [connected])
            return (
              <>
                <ConnectButton accountStatus="avatar" chainStatus="none" />
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
              {userInfo[1]}
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
              <MenuItem onClick={() => handleMenuItemClick("/profile")}>
                个人信息
              </MenuItem>
              <MenuItem onClick={() => handleMenuItemClick("/my-pets")}>
                我的宠物
              </MenuItem>
            </Menu>
          </>
        )}
      </div>
    </header>
  )
})

export default Header
