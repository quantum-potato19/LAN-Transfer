# 🚀 LAN Transfer — Ultra-Fast Local File Transfer

<p align="center">
  <a href="#-lan-transfer---ultra-fast-local-file-transfer">English</a> •
  <a href="#-lan-transfer---极速局域网文件传输工具-中文说明">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v1.2.0-blue.svg" alt="Release" />
  <img src="https://img.shields.io/badge/Platform-Windows-orange.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
</p>

<p align="center">
  <a href="https://github.com/quantum-potato19/LAN-Transfer/releases/latest">
    <img src="https://img.shields.io/badge/Download-GitHub_Releases-blue?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows EXE" />
  </a>
</p>

**LAN Transfer** is a modern, high-performance local area network file-sharing desktop application built with **Electron 30, React 18, TypeScript, Vite, and Tailwind CSS**. Engineered for multi-gigabit wire speeds, it enables peer-to-peer sharing across PC clients and allows **mobile devices to send and receive files instantly via standard web browsers by scanning a QR code**—no mobile app installation required.

---

## Interface Preview

| ☀️ Light Mode | 🌙 Dark Mode |
| :---: | :---: |
| ![Light Mode](docs/images/main_light.png) | ![Dark Mode](docs/images/main_dark.png) |

---

## Key Features & Architecture

### ⚡ 1. Saturated Bandwidth & Industrial Reliability
- **Raw TCP Socket Streaming**: Direct point-to-point TCP socket architecture with custom streaming serialization, bypassing HTTP chunk overhead and saturating Gigabit / 2.5G / Wi-Fi 6 bandwidth (up to 120MB/s+).
- **Adaptive HDD Write Rate-Smoothing**: Intelligent I/O backpressure queue regulates disk write frequency when receiving massive 20GB+ files on mechanical drives (HDD), preventing OS dirty-page cache saturation and UI freezes.
- **In-Flight `.part` Isolation & Atomic Commit**: Active transfers stream directly into temporary `.part` files. Upon 100% completion and length verification, files are atomically renamed to destination paths. Incomplete or aborted files are instantly purged to prevent disk clutter.
- **Single Instance & Port Guard**: Implements `app.requestSingleInstanceLock()` to guarantee exclusive ownership of communication ports `12138` and `12139`, seamlessly focusing the existing window if a duplicate instance is launched.
- **Active Transfer Exit Protection**: Intercepts accidental window closure during active transfers, prompting a double-confirmation modal to protect in-flight data.

### 📱 2. Zero-Install Mobile Web Sharing
- **Browser-Based Quick Share**: Built-in zero-dependency HTTP & WebSocket server. Mobile devices on the same Wi-Fi scan an on-screen QR code to instantly exchange files with PCs or other phones.
- **Dual-Layer Anti-Suspension Wake-Lock**: Integrates the W3C Screen Wake Lock API alongside a zero-overhead fallback (1fps memory micro-video loop + 44-byte RFC silent WAV audio stream), preventing Android/iOS browser engines from throttling or freezing background uploads.
- **Live Mobile Perception Badge**: Real-time perception and visual pulsing badge inside the Web Share modal when a mobile device connects, with one-click direct push.

### 🚀 3. Zero-Disk I/O Network Benchmark
- **Pure Memory Throughput Diagnostics**: Measure raw physical LAN throughput to any target PC or mobile phone using reusable memory buffers without writing bytes to disk.
- **Bottleneck Troubleshooting**: Automatically diagnoses bandwidth degradation, identifying common bottlenecks such as active VPN/proxy tunnel interception or 2.4GHz vs 5GHz Wi-Fi mismatch.

### 🔍 4. Radar Device Discovery & Fluid UI
- **Zero-Config Radar Scanner**: Seamless device perception combining UDP multicast discovery and subnet port scans, rendered on an interactive visual radar.
- **iOS-Inspired Dynamic Island**: Floating status pill at the top of the interface displaying real-time speed, progress, remaining time, and controls to pause, resume, or abort transfers.
- **Dual Liquid Glass Themes**: High-contrast, meticulously calibrated Dark and Light glassmorphism themes with customizable Shiba Inu avatar accessories.

---

## Download & Installation

### 📥 Download Installer
Pre-built Windows binaries are distributed via **GitHub Releases** (binary packages are excluded from Git to keep the repository lightweight):
- 🚀 [**Download Latest Windows Installer (GitHub Releases)**](https://github.com/quantum-potato19/LAN-Transfer/releases/latest)
- 📦 [**View All Release Versions & Changelogs**](https://github.com/quantum-potato19/LAN-Transfer/releases)

### 💿 Installation Steps
1. Download the latest installer from [**GitHub Releases**](https://github.com/quantum-potato19/LAN-Transfer/releases/latest).
2. Double-click `LAN Transfer_Setup_1.2.0.exe` to run the setup wizard and choose your installation directory.
3. Launch **LAN Transfer** from the desktop shortcut.
4. For mobile web sharing, click **“手机扫码互传” (Mobile Web Share)** on the sidebar to display the pairing QR code.

---

## Network & Firewall Troubleshooting

If devices cannot discover each other or transfers fail to establish, check the following Windows network configurations:

### 1. Set Network Profile to "Private"
Windows blocks incoming LAN connections by default when configured as a "Public" network.
- **Fix**: Click Network Icon in system tray -> Properties -> Change Network Profile from **Public** to **Private**.

### 2. Antivirus & Third-Party Firewalls (Huorong, 360, Windows Defender)
- **Fix**: Add `LAN Transfer.exe` or TCP/UDP ports `12138` and `12139` to your firewall's trusted whitelist.

### 3. Administrator Port Command
If your firewall rules are managed by your organization:
1. Open `cmd` as Administrator.
2. Run:
   ```cmd
   netsh advfirewall firewall add rule name="LAN-Transfer-TCP" dir=in action=allow protocol=TCP localport=12138,12139 program="%LocalAppData%\Programs\LAN Transfer\LAN Transfer.exe"
   ```

---

## Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Run in development mode
npm run dev

# 3. Build Windows installer package
npm run build
```

Packaged installers will be generated under the local `release/` directory.

---
---

# 🚀 LAN Transfer - 极速局域网文件传输工具 (中文说明)

**LAN Transfer** 是一款基于 **Electron 30 + React 18 + TypeScript + Vite + Tailwind CSS** 构建的高性能局域网文件传输工具。支持 PC 客户端间物理满速 P2P 文件互传，并支持**手机免安装 APP 扫码一键互传**，在局域网内实现零配置、多端全平台的文件传输体验。

---

## 核心功能与架构亮点

### ⚡ 1. 跑满物理带宽与工业级可靠性保障
- **TCP Raw Socket 极速串流**：采用纯原生流式 TCP 套接字通道，规避 HTTP 分块开销，轻松跑满千兆 / 2.5G / Wi-Fi 6 局域网带宽（实测达 120MB/s+）。
- **机械硬盘 (HDD) 自适应写入速率平滑队列**：针对超大文件（>20GB）接收端加入动态背压平滑队列，防止突发高速写入导致 OS 脏页饱和与磁盘 I/O 挤占系统卡顿。
- **未完成传输 `.part` 文件临时隔离与原子替换**：传输中写入临时 `.part` 文件，校验通过后原子重命名替换；传输异常或主动中止时自动清除碎片，绝不残留损坏文件。
- **单实例互斥锁与端口守护**：依托 `app.requestSingleInstanceLock()` 保证底层 `12138` 与 `12139` 端口独占，防止多开冲突；重复启动自动激活唤醒前台窗口。
- **传输中安全退出拦截与双重确认**：在传输进行中拦截意外点击关闭窗口事件，弹出防误触弹窗，确保大文件传输不被误杀。

### 📱 2. 手机端免安装 APP 极速扫码互传
- **网页共享引擎**：内置零依赖 HTTP / WebSocket 微服务，手机连接同一 Wi-Fi 扫码即可直接在 Safari / Chrome 中收发文件，支持 PIN 码安全隔离。
- **双重屏幕保活与微循环防后台休眠**：采用 W3C Screen Wake Lock API + 1fps 内存微视频 + 44 字节静音 WAV 微音频循环双重兜底，防止低端安卓或 iOS 切后台内核被系统挂起中断。
- **手机在线感知与即时推送**：手机连接后网页共享弹窗即刻展示动态脉冲感知徽章，支持电脑端一键推送到手机网页下载区。

### 🚀 3. 零磁盘 I/O 纯内存复用测速
- **物理局域网通道测速**：一键对目标 PC 或手机进行真实吞吐测试，Buffer 内存复用循环，完全不写硬盘。
- **网络瓶颈诊断提示**：智能识别传输受限原因，并针对代理梯子 TUN/回环劫持、2.4GHz/5GHz 频段混用提供精准优化建议。

### 🔍 4. 动态雷达设备感知与现代美学
- **智能雷达扫描**：UDP 局域网广播感知结合局域网 TCP 轮询，开机即显在线电脑与手机，支持点击直发与 IP 直连。
- **iOS 灵动岛交互 (Dynamic Island)**：置顶悬浮动态岛，展示实时速度、剩余时间、并支持暂停、恢复与中止。
- **白天 / 黑夜高对比度双主题**：精心调校的毛玻璃质感，配备萌趣柴犬头像身份系统。

---

## 快速下载与安装

### 📥 安装包下载
为避免大体积二进制文件污染 Git 仓库历史，安装包现已统一迁移至 **GitHub Releases** 托管分发：
- 🚀 [**前往 GitHub Releases 下载最新 Windows 安装包**](https://github.com/quantum-potato19/LAN-Transfer/releases/latest)
- 📦 [**查看历史全部版本与更新日志**](https://github.com/quantum-potato19/LAN-Transfer/releases)

### 💿 安装指南
1. 点击上方链接前往 [**GitHub Releases**](https://github.com/quantum-potato19/LAN-Transfer/releases/latest) 下载最新发布的安装包。
2. 双击运行 `LAN Transfer_Setup_1.2.0.exe` 安装程序，按提示完成安装。
3. 安装完成后打开桌面快捷方式使用；如需与手机互传，点击侧边栏 **“手机扫码互传”** 展开二维码扫码即可。

---

## 局域网排查指南

若两台设备无法扫描到对方或传输连接失败，请按顺序检查：
1. **网络配置文件改为“专用”**：Windows 默认的“公用网络”会防火墙阻断局域网嗅探。右下角网络图标 -> 属性 -> 将“公用”改为 **“专用”**。
2. **安全软件放行**：检查火绒、360 或 Defender，将 `12138` 和 `12139` 端口加入允许放行规则。
3. **关闭梯子/代理的本地回环接管**：部分 VPN / 代理客户端（如 Clash / v2ray / Sing-box）开启 TUN 模式后会限制本地回环与 LAN 流量，导致测速在 20MB/s 封顶，测速前建议暂时绕过局域网或退出。

---

## 开发者与编译打包

```bash
# 安装依赖
npm install

# 本地热更新调试
npm run dev

# 编译打包出 Windows 安装包
npm run build
```

打包生成文件位于本地 `release/` 目录。
