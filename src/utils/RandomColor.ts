export const randomColor = () => {
  // 随机数转16进制，截取6个字符
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .substr(0, 9)
  )
}
