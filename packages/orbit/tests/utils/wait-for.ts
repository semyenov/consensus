async function waitFor(valueA, toBeValueB, pollInterval = 100) {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (await valueA() === await toBeValueB()) {
        clearInterval(interval)
        resolve(true)
      }
    }, pollInterval)
  })
}

export default waitFor
