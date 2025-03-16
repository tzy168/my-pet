import type { NextPage } from "next"
import styles from "../styles/Home.module.css"
import { useRouter } from "next/router"
import { observer } from "mobx-react-lite"

const Home: NextPage = () => {
  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.title}>欢迎使用 MyPet</h1>
        <h3 className={styles.description}>您的数字宠物管理平台</h3>
      </div>
    </>
  )
}

export default observer(Home)
