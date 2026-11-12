/**
 * Vercel CLI 65.x（native 二进制）在中文计算机名的 Windows 上会崩溃：
 *   TypeError: Cannot convert argument to a ByteString
 *   because the character at index 0 has a value of 21776 ...
 *
 * 原因：CLI 把 os.hostname() 的值塞进 HTTP 请求 header，而 header 只接受
 * Latin-1 字符；非 ASCII 主机名会直接抛异常，导致 login / deploy 全部失败。
 *
 * 用法（不要修改系统主机名）：
 *   NODE_OPTIONS="--require <本文件绝对路径>" vercel login
 *   NODE_OPTIONS="--require <本文件绝对路径>" vercel --prod
 *
 * Windows PowerShell：
 *   $env:NODE_OPTIONS = "--require C:\path\to\vercel-hostname-ascii.cjs"
 *   vercel login
 */
const os = require("node:os");

if (!process.env.VERCEL_HOSTNAME_PATCH_DISABLED) {
  try {
    Object.defineProperty(os, "hostname", {
      value: () => "FITPLAN-PC",
      configurable: true,
      writable: true
    });
  } catch {
    // 某些运行时不允许覆盖，忽略即可；此时可考虑临时改系统主机名
  }
}
