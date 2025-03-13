import type { NextPage } from "next"
import styles from "../styles/Home.module.css"
import { useEffect } from "react"
import { useRouter } from "next/router"
import { userStore } from "../stores/userStore"
import { observer } from "mobx-react-lite"

const Home: NextPage = () => {
  const { userInfo, isRegistered } = userStore.useContainer()
  const router = useRouter()

  

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>欢迎使用 MyPet</h1>
        <p className={styles.description}>您的数字宠物管理平台</p>
      </div>
    </>
  )
}

export default observer(Home)
