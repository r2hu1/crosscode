import { spawn, execFileSync } from "child_process"
import net from "net"
import chalk from "chalk"

export const DEBUG = process.env.CROSSCODE_DEBUG === "1"

let logWriter: ((msg: string) => void) | null = null

export function setLogWriter(fn: (msg: string) => void) {
    logWriter = fn
}

export function debug(msg: string, meta?: Record<string, unknown>) {
    if (DEBUG) {
        const ts = new Date().toISOString()
        const extra = meta ? ` ${JSON.stringify(meta)}` : ""
        const line = `[${ts}] [DEBUG] ${msg}${extra}`
        console.log(chalk.dim(line))
        logWriter?.(line)
    }
}

export function censorAuth(val: string | undefined): string {
    if (!val) return "<none>"
    if (val.startsWith("Basic ")) {
        return `Basic ${val.substring(6, 14)}...`
    }
    return `${val.substring(0, 8)}...`
}

export function censorToken(val: string): string {
    if (val.length <= 16) return "***"
    return `${val.substring(0, 8)}...${val.substring(val.length - 4)}`
}

export function checkDep(name: string): boolean {
    const finder = process.platform === "win32" ? "where" : "which"
    try {
        execFileSync(finder, [name], { stdio: "ignore" })
        return true
    } catch {
        return false
    }
}

export function getFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer()
        srv.on("error", reject)
        srv.listen(0, "127.0.0.1", () => {
            const addr = srv.address() as net.AddressInfo
            const port = addr.port
            srv.close(() => resolve(port))
        })
    })
}

export function spawnCmd(cmd: string, args: string[], opts: Parameters<typeof spawn>[2] = {}) {
    return spawn(cmd, args, { ...opts, shell: false })
}

export function openBrowser(url: string): void {
    if (!url.startsWith("https://") && !url.startsWith("http://")) return
    const platform = process.platform
    try {
        if (platform === "darwin") {
            execFileSync("open", [url])
        } else if (platform === "win32") {
            execFileSync("cmd", ["/c", "start", "", url])
        } else {
            execFileSync("xdg-open", [url])
        }
    } catch {}
}
