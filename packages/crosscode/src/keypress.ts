let dataListener: ((data: Buffer) => void) | null = null

export function onKeypress(callback: (key: string) => void) {
    if (dataListener) {
        process.stdin.removeListener("data", dataListener)
    }

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
        process.stdin.resume()
    }

    dataListener = (data: Buffer) => {
        if (data.length === 1 && data[0] === 0x6c) callback("l")
        else if (data.length === 1 && data[0] === 0x68) callback("h")
        else if (data.length === 1 && data[0] === 0x03) callback("ctrl-c")
    }

    process.stdin.on("data", dataListener)
}

export function cleanupKeypress() {
    if (dataListener) {
        process.stdin.removeListener("data", dataListener)
        dataListener = null
    }

    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false)
        process.stdin.pause()
    }
}