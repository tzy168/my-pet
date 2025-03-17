import React from "react"
import { CircularProgress, Box } from "@mui/material"
import { useGlobalStore } from "../../stores/global"
import { observer } from "mobx-react-lite"

const Spin: React.FC = observer(() => {
  const { isLoading } = useGlobalStore()

  if (!isLoading) return null

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        zIndex: 9999,
      }}
    >
      <CircularProgress />
    </Box>
  )
})

export default Spin
