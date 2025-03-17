import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useGlobalStore } from "../stores/global";
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
} from "@mui/material";
import styles from "../styles/MyPets.module.css";

const MyPets: React.FC = observer(() => {
  const { userInfo } = useGlobalStore();
  const [pets, setPets] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPet, setNewPet] = useState({
    name: "",
    species: "",
    age: "",
    description: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    // TODO: 获取用户的宠物列表
    // fetchPets();
  }, []);

  const handleAddPet = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewPet({
      name: "",
      species: "",
      age: "",
      description: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPet((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // TODO: 实现添加宠物的逻辑
      handleCloseDialog();
      setSnackbar({
        open: true,
        message: "添加成功",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: "添加失败，请重试",
        severity: "error",
      });
    }
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.header}>
        <Typography variant="h5">我的宠物</Typography>
        <Button variant="contained" onClick={handleAddPet}>
          添加宠物
        </Button>
      </Box>

      <Grid container spacing={3}>
        {pets.map((pet: any) => (
          <Grid item xs={12} sm={6} md={4} key={pet.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{pet.name}</Typography>
                <Typography color="textSecondary">{pet.species}</Typography>
                <Typography variant="body2">
                  年龄：{pet.age}岁
                </Typography>
                <Typography variant="body2">{pet.description}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>添加新宠物</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="宠物名称"
            fullWidth
            value={newPet.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="species"
            label="物种"
            fullWidth
            value={newPet.species}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="age"
            label="年龄"
            type="number"
            fullWidth
            value={newPet.age}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="描述"
            fullWidth
            multiline
            rows={4}
            value={newPet.description}
            onChange={handleChange}
          />
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

export default MyPets;