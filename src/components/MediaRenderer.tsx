import React from "react";
import { Box, Typography } from "@mui/material";

interface MediaRendererProps {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * 媒体文件渲染组件
 * 根据文件URL自动判断是图片还是视频，并使用相应的组件进行渲染
 */
const MediaRenderer: React.FC<MediaRendererProps> = ({
  src,
  alt = "媒体文件",
  width = "100%",
  height = "auto",
  style = {},
  className = "",
}) => {
  // 判断文件类型
  const isVideo = (
    src.toLowerCase().endsWith(".mp4") ||
    src.toLowerCase().endsWith(".webm") ||
    src.toLowerCase().endsWith(".ogg") ||
    src.toLowerCase().endsWith(".mov")
  );

  // 处理IPFS链接
  const formattedSrc = src.startsWith("http") ? src : `http://localhost:8080/ipfs/${src}`;

  if (isVideo) {
    return (
      <Box className={className} sx={{ width, height, ...style }}>
        <video
          src={formattedSrc}
          controls
          width="100%"
          height="100%"
          style={{ objectFit: "cover", borderRadius: "4px" }}
        >
          <Typography variant="body2" color="error">
            您的浏览器不支持视频播放
          </Typography>
        </video>
      </Box>
    );
  }

  // 默认作为图片处理
  return (
    <Box className={className} sx={{ width, height, ...style }}>
      <img
        src={formattedSrc}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "4px",
        }}
      />
    </Box>
  );
};

export default MediaRenderer;