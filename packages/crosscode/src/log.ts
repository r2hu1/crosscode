import { createWriteStream, mkdirSync, existsSync, statSync, renameSync, unlinkSync } from "fs"
import { join } from "path"
import { homedir } from "os"
import type { WriteStream } from "fs"

const MAX_LOG_SIZE = 1024 * 1024

export const logDir = join(homedir(), ".crosscode")
export const configFile = join(logDir, "config.json")
export const cloudflaredTunnelDir = join(logDir, "cloudflared")
export const cfCertPath = join(homedir(), ".cloudflared", "cert.pem")

if (!existsSync(logDir))
    mkdirSync(logDir, { recursive: true, mode: 0o700 })

export const crosscodeLogFile = join(logDir, "crosscode.log")
export const cloudflaredLogFile = join(logDir, "cloudflared.log")
export const opencodeLogFile = join(logDir, "opencode.log")
export const ngrokLogFile = join(logDir, "ngrok.log")

function rotateLogIfNeeded(logFile: string) {
    try {
        if (existsSync(logFile)) {
            const stats = statSync(logFile)
            if (stats.size > MAX_LOG_SIZE) {
                const backup = `${logFile}.1`
                if (existsSync(backup)) unlinkSync(backup)
                renameSync(logFile, backup)
            }
        }
    } catch (err) {
        // Log rotation is best-effort; permission errors on the log dir are non-fatal
        if (process.env.CROSSCODE_DEBUG === "1") {
            console.error(`[log] rotation failed for ${logFile}: ${err instanceof Error ? err.message : err}`)
        }
    }
}

rotateLogIfNeeded(crosscodeLogFile)
rotateLogIfNeeded(cloudflaredLogFile)
rotateLogIfNeeded(opencodeLogFile)
rotateLogIfNeeded(ngrokLogFile)

export const crosscodeLogStream = createWriteStream(crosscodeLogFile, { flags: "a", mode: 0o600 })
export const cloudflaredLogStream = createWriteStream(cloudflaredLogFile, { flags: "a", mode: 0o600 })
export const opencodeLogStream = createWriteStream(opencodeLogFile, { flags: "a", mode: 0o600 })
export const ngrokLogStream = createWriteStream(ngrokLogFile, { flags: "a", mode: 0o600 })

export function logCrosscode(msg: string) {
    crosscodeLogStream.write(`${new Date().toISOString()} ${msg}\n`)
}

export const allLogStreams: WriteStream[] = [
    crosscodeLogStream,
    cloudflaredLogStream,
    opencodeLogStream,
    ngrokLogStream,
]

export function closeAllLogs(): Promise<void> {
    return Promise.all(
        allLogStreams.map(s => new Promise<void>(r => s.end(r)))
    ).then(() => {})
}
