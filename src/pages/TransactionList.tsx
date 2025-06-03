import React, { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useGlobalStore } from "../stores/global"
import { fetchTransactionHashes } from "../utils/ipfs"
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Link,
  Chip,
} from "@mui/material"

const IPFS_GATEWAY = "http://localhost:8080/ipfs/"

const TransactionList: React.FC = observer(() => {
  const { petContract } = useGlobalStore()
  const [hashes, setHashes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadHashes = async () => {
      if (!petContract) return

      try {
        setIsLoading(true)
        const result = await fetchTransactionHashes(petContract)
        setHashes(result)
      } catch (error) {
        console.error("获取交易哈希失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHashes()
  }, [petContract])

  return (
    <Card sx={{ mb: 3, mt: 3 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          交易记录
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          以下是系统中所有记录的交易哈希，点击可查看详细信息
        </Typography>

        {isLoading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : hashes.length > 0 ? (
          <List>
            {hashes.map((hash, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={`交易 #${index + 1}`}
                          size="small"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                        <Link
                          href={`${IPFS_GATEWAY}${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          {hash.length > 20
                            ? `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`
                            : hash}
                        </Link>
                      </Box>
                    }
                    secondary={`记录时间: ${new Date().toLocaleString()}`}
                  />
                </ListItem>
                {index < hashes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body1" align="center" sx={{ my: 3 }}>
            暂无交易记录
          </Typography>
        )}
      </CardContent>
    </Card>
  )
})

export default TransactionList
