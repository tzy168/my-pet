import React, { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import { useRouter } from "next/router"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Chip,
  CircularProgress,
} from "@mui/material"
import { ContractConfig } from "../config/contracts"
import TransactionList from "../components/TransactionList"

const SystemInfo: React.FC = observer(() => {
  const router = useRouter()
  const {
    contract,
    isContractDeployer,
    walletAddress,
    petContract,
    userContract,
  } = useGlobalStore()

  useEffect(() => {
    if (!isContractDeployer) {
      router.push("/")
      return
    }
  }, [isContractDeployer, router])

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h5">系统信息</Typography>
      </Box>

      {/* 系统信息卡片 */}
      <Card sx={{ mb: 4, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            系统信息
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                合约地址
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  机构管理合约：
                </Typography>
                <Chip
                  label={ContractConfig.InstitutionManager.address}
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    bgcolor: "#e3f2fd",
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  用户管理合约：
                </Typography>
                <Chip
                  label={ContractConfig.UserManager.address}
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    bgcolor: "#e3f2fd",
                  }}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  宠物管理合约：
                </Typography>
                <Chip
                  label={ContractConfig.PetManager.address}
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    bgcolor: "#e3f2fd",
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                系统状态
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  合约部署者地址：
                </Typography>
                {walletAddress ? (
                  <Chip
                    label={walletAddress}
                    color="primary"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  />
                ) : (
                  <CircularProgress size={20} />
                )}
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  机构管理合约状态：
                </Typography>
                <Chip
                  label={contract ? "已连接" : "未连接"}
                  color={contract ? "success" : "error"}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  用户管理合约状态：
                </Typography>
                <Chip
                  label={userContract ? "已连接" : "未连接"}
                  color={userContract ? "success" : "error"}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", mb: 0.5 }}
                >
                  宠物管理合约状态：
                </Typography>
                <Chip
                  label={petContract ? "已连接" : "未连接"}
                  color={petContract ? "success" : "error"}
                  variant="outlined"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* 交易记录列表 */}
      <Card sx={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            交易记录
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <TransactionList />
        </CardContent>
      </Card>
    </Box>
  )
})

export default SystemInfo