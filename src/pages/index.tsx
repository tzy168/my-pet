import type { NextPage } from "next"
import styles from "../styles/Home.module.css"
import { useRouter } from "next/router"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import { useEffect, useState } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CardActionArea,
  Container,
  Paper,
  Fade,
  Zoom,
} from "@mui/material"
import {
  PetsRounded,
  PersonRounded,
  BusinessRounded,
  InfoRounded,
  VerifiedUser,
  Security,
  Speed,
} from "@mui/icons-material"
import PetIconPlay from "../components/PetIconPlay"

const Home: NextPage = () => {
  const router = useRouter()
  const { contract, petContract, userContract } = useGlobalStore()
  const [stats, setStats] = useState({
    userCount: 0,
    petCount: 0,
    institutionCount: 0,
  })

  const fetchStats = async () => {
    try {
      // 这里可以调用合约方法获取实际数据
      // 示例数据
      setStats({
        userCount: 120,
        petCount: 350,
        institutionCount: 15,
      })
    } catch (error) {
      console.error("获取统计数据失败:", error)
    }
  }

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  useEffect(() => {
    if (contract && userContract && petContract) {
      fetchStats()
    }
  }, [contract, userContract, petContract])
  return (
    <Container maxWidth="lg" className={styles.container}>
      <Box
        sx={{
          textAlign: "center",
          mb: 8,
          mt: 6,
          position: "relative",
        }}
      >
        <Fade in={true} timeout={1000}>
          <Typography
            variant="h2"
            component="h1"
            className={styles.title}
            sx={{
              fontWeight: 800,
              mb: 2,
              background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
              fontSize: { xs: "18rem", md: "18rem" },
            }}
          >
            MyPet
          </Typography>
        </Fade>
        <Typography
          sx={{
            fontSize: { xs: "3rem", md: "3rem" },
          }}
        >
          🥳
        </Typography>
      </Box>
      <PetIconPlay />
      {/* 功能导航卡片 */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            position: "relative",
            display: "inline-block",
            "&:after": {
              content: '""',
              position: "absolute",
              bottom: -8,
              left: "50%",
              width: "80px",
              height: "4px",
              backgroundColor: "primary.main",
              transform: "translateX(-50%)",
              borderRadius: "2px",
            },
          }}
        >
          主要功能
        </Typography>
      </Box>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: "100ms" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea onClick={() => handleNavigate("/my-pets")}>
                <Box
                  sx={{
                    height: "8px",
                    background: "linear-gradient(90deg, #FF9800, #F57C00)",
                  }}
                />
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FFF8E1, #FFECB3)",
                      margin: "0 auto 16px",
                    }}
                  >
                    <PetsRounded sx={{ fontSize: 40, color: "#FF9800" }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    宠物管理
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    添加和管理您的宠物信息，包括品种、年龄和健康记录
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: "200ms" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea onClick={() => handleNavigate("/profile")}>
                <Box
                  sx={{
                    height: "8px",
                    background: "linear-gradient(90deg, #2196F3, #1976D2)",
                  }}
                />
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #E3F2FD, #BBDEFB)",
                      margin: "0 auto 16px",
                    }}
                  >
                    <PersonRounded sx={{ fontSize: 40, color: "#2196F3" }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    个人资料
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    管理您的个人信息和账户设置
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: "300ms" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea onClick={() => handleNavigate("/admin")}>
                <Box
                  sx={{
                    height: "8px",
                    background: "linear-gradient(90deg, #4CAF50, #388E3C)",
                  }}
                />
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)",
                      margin: "0 auto 16px",
                    }}
                  >
                    <BusinessRounded sx={{ fontSize: 40, color: "#4CAF50" }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ fontWeight: 600 }}
                  >
                    机构查询
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    查找和了解注册的宠物相关机构信息
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Zoom in={true} style={{ transitionDelay: "400ms" }}>
            <Card
              sx={{
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                transition: "all 0.3s ease",
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-8px)",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <CardActionArea>
                <Box
                  sx={{
                    height: "8px",
                    background: "linear-gradient(90deg, #9C27B0, #7B1FA2)",
                  }}
                />
                <CardContent sx={{ textAlign: "center", p: 4 }}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #F3E5F5, #E1BEE7)",
                      margin: "0 auto 16px",
                    }}
                  >
                    <InfoRounded sx={{ fontSize: 40, color: "#9C27B0" }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    onClick={() => {
                      router.push("./system-guide")
                    }}
                    sx={{ fontWeight: 600 }}
                  >
                    使用指南
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6 }}
                  >
                    了解如何使用MyPet平台的各项功能
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Zoom>
        </Grid>
      </Grid>
      {/* 系统介绍 */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            position: "relative",
            display: "inline-block",
            "&:after": {
              content: '""',
              position: "absolute",
              bottom: -8,
              left: "50%",
              width: "80px",
              height: "4px",
              backgroundColor: "primary.main",
              transform: "translateX(-50%)",
              borderRadius: "2px",
            },
          }}
        >
          关于MyPet
        </Typography>
      </Box>
      <Fade in={true} timeout={1000}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 8,
            borderRadius: "16px",
            background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <Typography
            variant="body1"
            paragraph
            sx={{
              fontSize: "1.1rem",
              lineHeight: 1.7,
              color: "text.primary",
            }}
          >
            MyPet是一个基于区块链技术的宠物管理平台，旨在为宠物主人、宠物医院和相关机构提供一个透明、安全的宠物信息管理系统。
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mt: 3,
              mb: 2,
              fontWeight: 600,
              color: "primary.main",
            }}
          >
            通过MyPet，您可以：
          </Typography>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(33, 150, 243, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    mt: 0.5,
                  }}
                >
                  <PetsRounded color="primary" />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: "1.05rem",
                  }}
                >
                  记录和管理宠物的基本信息和健康状况
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(76, 175, 80, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    mt: 0.5,
                  }}
                >
                  <VerifiedUser sx={{ color: "#4CAF50" }} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: "1.05rem",
                  }}
                >
                  证明宠物所有权，防止宠物丢失或被盗
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(156, 39, 176, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    mt: 0.5,
                  }}
                >
                  <Security sx={{ color: "#9C27B0" }} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: "1.05rem",
                  }}
                >
                  与宠物医院和其他机构安全地共享宠物信息
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    minWidth: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 152, 0, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 2,
                    mt: 0.5,
                  }}
                >
                  <Speed sx={{ color: "#FF9800" }} />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    lineHeight: 1.6,
                    fontSize: "1.05rem",
                  }}
                >
                  追踪宠物的医疗历史和接种记录
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box
            sx={{
              mt: 4,
              p: 2,
              borderRadius: "8px",
              backgroundColor: "rgba(33, 150, 243, 0.05)",
              border: "1px dashed rgba(33, 150, 243, 0.3)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              基于区块链技术，MyPet确保您的宠物数据安全、透明且不可篡改，为宠物管理提供可靠的数字化解决方案。
            </Typography>
          </Box>
        </Paper>
      </Fade>
      {/* 技术优势 */}
      <Box
        sx={{
          mb: 8,
          mt: 6,
          p: { xs: 3, md: 5 },
          borderRadius: "16px",
          background:
            "linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(33, 150, 243, 0.1))",
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            color: "primary.main",
          }}
        >
          区块链技术优势
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: "100ms" }}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    background: "white",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <Security sx={{ fontSize: 32, color: "primary.main" }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  数据安全
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  区块链技术确保宠物数据安全存储，防止未授权访问和数据篡改，保护您的宠物信息安全。
                </Typography>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: "200ms" }}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    background: "white",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 32, color: "primary.main" }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  所有权证明
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  通过区块链技术，可以不可篡改地记录宠物所有权，为您提供可靠的数字化所有权证明。
                </Typography>
              </Box>
            </Fade>
          </Grid>

          <Grid item xs={12} md={4}>
            <Fade in={true} timeout={1000} style={{ transitionDelay: "300ms" }}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    background: "white",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                  }}
                >
                  <Speed sx={{ fontSize: 32, color: "primary.main" }} />
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  高效透明
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.7 }}
                >
                  区块链网络提供高效、透明的数据处理，让您可以随时查看和验证宠物信息的真实性和完整性。
                </Typography>
              </Box>
            </Fade>
          </Grid>
        </Grid>
      </Box>
      {/* 数据统计 */}
      <Box sx={{ mb: 2, textAlign: "center" }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            mb: 4,
            fontWeight: 700,
            position: "relative",
            display: "inline-block",
            "&:after": {
              content: '""',
              position: "absolute",
              bottom: -8,
              left: "50%",
              width: "80px",
              height: "4px",
              backgroundColor: "primary.main",
              transform: "translateX(-50%)",
              borderRadius: "2px",
            },
          }}
        >
          平台数据
        </Typography>
      </Box>
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: "100ms" }}>
            <Card
              sx={{
                textAlign: "center",
                p: 4,
                borderRadius: "16px",
                background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #E3F2FD, #BBDEFB)",
                  boxShadow: "0 8px 16px rgba(33, 150, 243, 0.2)",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: "#1976D2",
                    fontSize: { xs: "2rem", md: "2.5rem" },
                  }}
                >
                  {stats.userCount}
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mt: 2,
                }}
              >
                注册用户
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                }}
              >
                已在平台注册的用户总数
              </Typography>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: "200ms" }}>
            <Card
              sx={{
                textAlign: "center",
                p: 4,
                borderRadius: "16px",
                background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #FFF8E1, #FFECB3)",
                  boxShadow: "0 8px 16px rgba(255, 152, 0, 0.2)",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: "#FF9800",
                    fontSize: { xs: "2rem", md: "2.5rem" },
                  }}
                >
                  {stats.petCount}
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mt: 2,
                }}
              >
                注册宠物
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                }}
              >
                已在平台登记的宠物总数
              </Typography>
            </Card>
          </Zoom>
        </Grid>

        <Grid item xs={12} md={4}>
          <Zoom in={true} style={{ transitionDelay: "300ms" }}>
            <Card
              sx={{
                textAlign: "center",
                p: 4,
                borderRadius: "16px",
                background: "linear-gradient(145deg, #ffffff, #f5f5f5)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-10px)",
                  boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  background: "linear-gradient(135deg, #E8F5E9, #C8E6C9)",
                  boxShadow: "0 8px 16px rgba(76, 175, 80, 0.2)",
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    color: "#4CAF50",
                    fontSize: { xs: "2rem", md: "2.5rem" },
                  }}
                >
                  {stats.institutionCount}
                </Typography>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mt: 2,
                }}
              >
                合作机构
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 1,
                }}
              >
                已加入平台的合作机构数量
              </Typography>
            </Card>
          </Zoom>
        </Grid>
      </Grid>
    </Container>
  )
}

export default observer(Home)
