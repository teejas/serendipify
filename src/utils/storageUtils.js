import AsyncStorage from '@react-native-community/async-storage';

export const setUserData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value)
  } catch(error) {
    console.error(error)
  }
}

export const getUserData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key)
    if(value == null) {
      console.log("Item with key " + key + " not found.")
    }
    return value
  } catch(error) {
    console.error(error)
  }
}

export const clearAll = async () => {
  try {
    console.log("CLEARING ALL ASYNCSTORAGE")
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'expirationTime', 'deviceId']);
  } catch(error) {
    console.error(error)
  }
}
