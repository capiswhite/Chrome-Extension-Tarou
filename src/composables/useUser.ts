import { validate as uuidValidate, v4 as uuidv4 } from 'uuid'
import type { DropInfo } from 'api'
import { sendMultiDropInfo } from '~/api'
import { code, failedDropInfoList, uid } from '~/logic'

export default function useUser() {
  function checkUser(url: string) {
    const searchParams = new URLSearchParams(url)
    uid.value = searchParams.get('uid') || ''
    if (!uuidValidate(code.value))
      code.value = uuidv4()
  }

  function sendInfo(dropInfo: DropInfo[]) {
    failedDropInfoList.value = []
    console.log(failedDropInfoList.value.concat(dropInfo).length)

    const chunkList = splitArrayIntoGroups(failedDropInfoList.value.concat(dropInfo), 1000)
    console.log(chunkList.length)

    const chunkRetry = 3
    let retry = 0
    return new Promise<void>((resolve, reject) => {
      function handel() {
        const chunk = chunkList.shift()!
        sendMultiDropInfo(chunk)
          .then(() => {
            if (chunkList.length > 0) {
              handel()
              retry = 0
            }
            else {
              resolve()
            }
          })
          .catch(() => {
            retry++
            chunkList.push(chunk)
            if (retry > chunkRetry) {
              chunkList.forEach((c) => { failedDropInfoList.value = failedDropInfoList.value.concat(c) })
              reject(new Error('上传失败'))
              return
            }

            handel()
          })
      }

      handel()
    })
  }

  function splitArrayIntoGroups(array: DropInfo[], groupSize: number) {
    const result = []
    for (let i = 0; i < array.length; i += groupSize) {
      const group = array.slice(i, i + groupSize)
      result.push(group)
    }
    return result
  }

  return {
    checkUser,
    sendInfo,
  }
}
