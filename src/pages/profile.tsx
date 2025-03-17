import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useGlobalStore } from "../stores/global";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import styles from "../styles/Profile.module.css";

const Profile: React.FC = observer(() => {
  const { userInfo } = useGlobalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (userInfo) {
      setFormData({
        name: userInfo[1],
        email: userInfo[2],
        phone: userInfo[3],
      });
    }
  }, [userInfo]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // TODO: 实现保存逻辑
      setIsEditing(false);
      setSnackbar({
        open: true,
        message: "保存成功",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "保存失败，请重试",
        severity: "error",
      });
    }
  };

  const handleCancel = () => {
    if (userInfo) {
      setFormData({
        name: userInfo[1],
        email: userInfo[2],
        phone: userInfo[3],
      });
    }
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!userInfo) {
    return <div>加载中...</div>;
  }

  return (
    <Box className={styles.container}>
      <Card className={styles.card}>
        <CardContent>
          <Typography variant="h5" component="div" gutterBottom>
            个人信息
          </Typography>
          <Box className={styles.infoContainer}>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">用户名：</Typography>
              {isEditing ? (
                <TextField
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  size="small"
                />
              ) : (
                <Typography>{formData.name}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">邮箱：</Typography>
              {isEditing ? (
                <TextField
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  size="small"
                />
              ) : (
                <Typography>{formData.email}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">电话：</Typography>
              {isEditing ? (
                <TextField
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  size="small"
                />
              ) : (
                <Typography>{formData.phone}</Typography>
              )}
            </Box>
            <Box className={styles.infoItem}>
              <Typography variant="subtitle1">用户类型：</Typography>
              <Typography>
                {Number(userInfo[4]) === 0 ? "个人用户" : "机构用户"}
              </Typography>
            </Box>
            {Number(userInfo[4]) === 1 && (
              <Box className={styles.infoItem}>
                <Typography variant="subtitle1">所属机构ID：</Typography>
                <Typography>{Number(userInfo[5])}</Typography>
              </Box>
            )}
          </Box>
          <Box className={styles.buttonContainer}>
            {isEditing ? (
              <>
                <Button variant="contained" onClick={handleSave}>
                  保存
                </Button>
                <Button variant="outlined" onClick={handleCancel}>
                  取消
                </Button>
              </>
            ) : (
              <Button variant="contained" onClick={handleEdit}>
                编辑
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
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
  );
});

export default Profile;