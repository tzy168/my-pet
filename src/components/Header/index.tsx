import React, { useState } from "react"
import { observer } from "mobx-react-lite"
import { userStore } from "../../stores/userStore"
import styles from "./styles.module.css"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import Button from "@mui/material/Button"
import LogoutIcon from "@mui/icons-material/Logout"

const Header: React.FC = observer(() => {
  const { userInfo, walletAddress } = userStore.useContainer()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleDisconnect = () => {
    // userStore.disconnect();
    setIsDropdownOpen(false)
  }

  return (
    <header className={styles.header}>
      <h2 className={styles.logo}>MyPet</h2>
      <div className={styles.rightSection}>
        <div
          className={styles.userInfo}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {userInfo && (
            <>
              <span className={styles.userName}>{userInfo.name}</span>
              {isDropdownOpen && (
                <div className={styles.dropdown}>
                  <button className={styles.dropdownItem}>个人信息</button>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LogoutIcon />}
                    onClick={handleDisconnect}
                    sx={{
                      mt: 1,
                      bgcolor: "primary.main",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}
                  >
                    断开连接
                  </Button>
                </div>
              )}
              <span className={styles.walletAddress}>
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </span>
            </>
          )}
        </div>
        <ConnectButton
          chainStatus={{ smallScreen: "none", largeScreen: "none" }}
          showBalance={false}
        />
      </div>
    </header>
  )
})

export default Header
