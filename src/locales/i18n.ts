export type Language = 'en' | 'zh'

export const translations = {
  en: {
    // Sidebar
    send: 'Send Files',
    transferring: 'Transferring',
    history: 'History',
    settings: 'Settings',
    mobileShare: 'Mobile Web Share',
    windowsClient: 'Windows Client',

    // Radar
    scanning: 'Scanning LAN devices...',
    noDevices: 'No other devices found online',
    noDevicesSub: 'Open LAN Transfer on other devices to connect',
    sendFile: 'Send Files',
    speedTest: 'Speed Test',
    directIpPlaceholder: 'Enter LAN IP to connect (e.g. 192.168.0.6)',
    directConnect: 'Direct Connect',
    invalidIpAlert: 'Please enter a valid IPv4 address (e.g. 192.168.1.100)',

    // FileList
    sendTo: 'Send to',
    pendingFiles: 'Files to send',
    filesCount: 'file(s)',
    totalSize: 'Total Size',
    addFiles: 'Add Files',
    addFolder: 'Add Folder',
    sendNow: 'Send Now',
    removeFile: 'Remove file',
    close: 'Close',

    // DynamicIsland
    islandSendingTo: 'Sending to',
    islandReceivingFrom: 'From',
    islandPaused: 'Paused',
    islandCompleted: 'Transfer Completed Successfully',
    islandDeclined: 'Receiver declined the transfer',
    islandFailed: 'Transfer interrupted, please retry',
    islandRemaining: 'Remaining',
    islandCalculating: 'Calculating...',
    islandSeconds: 's',
    islandPause: 'Pause transfer',
    islandResume: 'Resume transfer',
    islandAbort: 'Abort',
    islandDismiss: 'Dismiss floating pill (transfers in background)',

    // Transferring View
    transSendingTo: 'Sending files to',
    transReceivingFrom: 'Receiving files from',
    transSize: 'Total Size',
    transTransferred: 'Transferred',
    transSpeed: 'Speed',
    transPaused: 'Paused',
    transSending: 'Sending',
    transReceiving: 'Receiving',
    transNoActive: 'No active transfers currently',
    transNoActiveSub: 'Select a device on the Radar page to send files and track details here',
    transContinue: 'Resume Transfer',
    transPause: 'Pause Transfer',
    transAbort: 'Abort Transfer',

    // History View
    historyTitle: 'Transfer History',
    historyEmpty: 'No transfer history',
    historySentTo: 'Sent to',
    historyReceivedFrom: 'Received from',
    historySuccess: 'Success',
    historyCancelled: 'Aborted',
    historyDeclined: 'Declined',
    historyFailed: 'Failed',

    // Settings View
    settingsTitle: 'Preferences & Settings',
    settingsNickname: 'Display Nickname',
    settingsNicknamePlaceholder: 'Enter LAN nickname',
    settingsUpdate: 'Update',
    settingsAvatar: 'Choose Shiba Avatar Accessory',
    settingsTheme: 'Interface Theme',
    settingsThemeDark: 'Dark',
    settingsThemeLight: 'Light',
    settingsLanguage: 'Language',
    settingsLangEn: 'English (Default)',
    settingsLangZh: '简体中文 (Chinese)',
    settingsLocalIp: 'Local LAN IP',
    settingsSaveDir: 'Default Download Directory',
    settingsChange: 'Change',

    // Incoming Transfer Modal
    incomingTitle: 'Incoming Transfer Request',
    incomingFrom: 'From',
    incomingWantsToSend: 'wants to send you:',
    incomingAndOthers: 'and other {n} file(s)',
    incomingDecline: 'Decline',
    incomingAccept: 'Accept',

    // Cancel Confirm Modal
    cancelTitle: 'Abort File Transfer?',
    cancelDesc: 'Aborting will terminate the active transfer immediately. Incomplete files will not be kept.',
    cancelBack: 'Cancel',
    cancelConfirm: 'Confirm Abort',

    // App Close Confirm Modal
    closeTitle: 'Active Transfer in Progress. Exit?',
    closeDesc: 'A file transfer is currently in progress. Exiting will abort all active tasks immediately.',
    closeContinue: 'Continue Transfer',
    closeForceExit: 'Force Exit',

    // Speed Test Modal
    speedTestTitle: '🚀 LAN Throughput Benchmark',
    speedTestTarget: 'Target Device',
    speedTestPureThroughput: '(Pure network throughput, zero disk I/O)',
    speedTestRealtime: 'Real-Time Bandwidth',
    speedTestAverage: 'Average Bandwidth',
    speedTestApprox: 'Approx.',
    speedTestRunning: '⚡ Running high-throughput multi-channel benchmark...',
    speedTestCancel: 'Cancel Benchmark',
    speedTestSlowTitle: '⚠️ Lower LAN bandwidth detected (~{mbps} Mbps). Suggestions:',
    speedTestSlowTip1: '1. Proxy/VPN: Disable TUN or loopback proxy routing (proxy tunnels often limit throughput to ~20MB/s).',
    speedTestSlowTip2: '2. Wi-Fi Band: Verify both PC and phone are on 5GHz Wi-Fi instead of congested 2.4GHz.',
    speedTestGoodNotice: '⚡ Excellent 5GHz Wi-Fi / Gigabit link! High transfer speeds assured.',
    speedTestOk: 'OK',
    speedTestFail: 'Benchmark failed: {error}',

    // Web Share Modal
    webShareTitle: 'Mobile Web Share (No App Needed)',
    webShareSub: 'Instant sharing over the same Wi-Fi',
    webShareService: 'Web Share Service',
    webShareRunning: 'Service Running (Ready for access)',
    webShareStopped: 'Service Stopped',
    webShareStartBtn: 'Start Service',
    webShareRunningBtn: 'Running',
    webShareMobileConnected: 'Mobile device connected ({n})',
    webShareSendToMobile: 'Send Files',
    webShareScanNotice: 'Scan using mobile camera or browser to access',
    webSharePinNotice: 'Pairing PIN (when entering URL manually):',
    webShareCopy: 'Copy',
    webShareCopied: 'Copied',
    webSharePushFiles: 'Push Files to Mobile Download Area',
    webSharePushedSuccess: 'Added to mobile download section!',
    webShareClose: 'Close Window',
    webShareStartNotice: 'Click button above to start service and display QR code'
  },

  zh: {
    // Sidebar
    send: '发送文件',
    transferring: '正在传输',
    history: '传输历史',
    settings: '系统设置',
    mobileShare: '手机扫码互传',
    windowsClient: 'Windows 客户端',

    // Radar
    scanning: '正在扫描局域网设备...',
    noDevices: '无其他在线设备',
    noDevicesSub: '在其他电脑或手机上打开本应用即可自动连入',
    sendFile: '发送文件',
    speedTest: '🚀 测速',
    directIpPlaceholder: '输入局域网 IP 直连 (例: 192.168.0.6)',
    directConnect: '直接连接',
    invalidIpAlert: '请输入有效的 IPv4 地址 (例如: 192.168.1.100)',

    // FileList
    sendTo: '发送给',
    pendingFiles: '待发送文件',
    filesCount: '个文件',
    totalSize: '总大小',
    addFiles: '添加文件',
    addFolder: '添加文件夹',
    sendNow: '立即发送',
    removeFile: '移除文件',
    close: '关闭',

    // DynamicIsland
    islandSendingTo: '发送至',
    islandReceivingFrom: '来自',
    islandPaused: '已暂停',
    islandCompleted: '传输已成功完成',
    islandDeclined: '接收端拒绝了传输',
    islandFailed: '传输中断，请重试',
    islandRemaining: '剩余时间',
    islandCalculating: '计算中...',
    islandSeconds: '秒',
    islandPause: '暂停传输',
    islandResume: '继续传输',
    islandAbort: '中止',
    islandDismiss: '收起浮窗 (后台继续传输)',

    // Transferring View
    transSendingTo: '正在发送文件至',
    transReceivingFrom: '正在接收来自',
    transSize: '传输大小',
    transTransferred: '已传输',
    transSpeed: '速度',
    transPaused: '已暂停',
    transSending: '发送中',
    transReceiving: '接收中',
    transNoActive: '当前没有进行中的传输任务',
    transNoActiveSub: '在主页选择局域网设备并发送文件即可在此查看详情',
    transContinue: '继续传输',
    transPause: '暂停传输',
    transAbort: '中止传输',

    // History View
    historyTitle: '文件传输记录',
    historyEmpty: '暂无传输历史',
    historySentTo: '发送给',
    historyReceivedFrom: '接收自',
    historySuccess: '成功',
    historyCancelled: '中止',
    historyDeclined: '被拒绝',
    historyFailed: '失败',

    // Settings View
    settingsTitle: '系统参数设置',
    settingsNickname: '用户昵称',
    settingsNicknamePlaceholder: '请输入局域网昵称',
    settingsUpdate: '更新',
    settingsAvatar: '选择柴犬头像配饰',
    settingsTheme: '界面主题',
    settingsThemeDark: '黑夜',
    settingsThemeLight: '白天',
    settingsLanguage: '语言选择 (Language)',
    settingsLangEn: 'English (默认)',
    settingsLangZh: '简体中文',
    settingsLocalIp: '本机局域网 IP',
    settingsSaveDir: '默认接收文件夹',
    settingsChange: '更改',

    // Incoming Transfer Modal
    incomingTitle: '文件接收请求',
    incomingFrom: '来自',
    incomingWantsToSend: '准备发送给您：',
    incomingAndOthers: '等 {n} 个文件',
    incomingDecline: '拒绝',
    incomingAccept: '同意接收',

    // Cancel Confirm Modal
    cancelTitle: '确定中止文件传输？',
    cancelDesc: '中止后当前任务将立即中断，未传输完成的文件将不会保留。',
    cancelBack: '取消',
    cancelConfirm: '确认中止',

    // App Close Confirm Modal
    closeTitle: '正在传输中，确定退出应用？',
    closeDesc: '当前仍有进行中的局域网文件传输任务，强制退出将立即中止所有传输。',
    closeContinue: '继续传输',
    closeForceExit: '强制退出',

    // Speed Test Modal
    speedTestTitle: '🚀 局域网通道测速',
    speedTestTarget: '目标设备',
    speedTestPureThroughput: '(纯网络吞吐，无磁盘写入)',
    speedTestRealtime: '实时物理带宽 (Real-time)',
    speedTestAverage: '最终平均带宽 (Average Bandwidth)',
    speedTestApprox: '约',
    speedTestRunning: '⚡ 全速多通道吞吐测流中，请稍候...',
    speedTestCancel: '取消测速',
    speedTestSlowTitle: '⚠️ 局域网带宽偏低 (约 {mbps} Mbps) 排查建议：',
    speedTestSlowTip1: '1. 代理/梯子卡顿：请关闭梯子/TUN代理软件（代理软件常限制本地回环吞吐在 20MB/s 左右）。',
    speedTestSlowTip2: '2. WiFi频段：确认电脑与手机连接的是 5GHz WiFi，避开 2.4GHz。',
    speedTestGoodNotice: '⚡ 良好 5GHz WiFi / 千兆局域网通道！传输速度优异。',
    speedTestOk: '确定',
    speedTestFail: '测速失败: {error}',

    // Web Share Modal
    webShareTitle: '手机扫码免 APP 互传',
    webShareSub: '同一 WiFi 极速连接手机与电脑',
    webShareService: '网页共享服务',
    webShareRunning: '服务运行中 (可免安装访问)',
    webShareStopped: '服务已关闭',
    webShareStartBtn: '开启服务',
    webShareRunningBtn: '运行中',
    webShareMobileConnected: '🟢 手机已连入 ({n} 台)',
    webShareSendToMobile: '发文件',
    webShareScanNotice: '使用手机自带相机或微信扫一扫直接访问',
    webSharePinNotice: '连接配对码 (手动输入网址时使用):',
    webShareCopy: '复制',
    webShareCopied: '已复制',
    webSharePushFiles: '推送文件到手机网页下载区',
    webSharePushedSuccess: '已添加到手机网页下载区！',
    webShareClose: '关闭窗口',
    webShareStartNotice: '点击上方按钮开启服务，即可展示二维码'
  }
}

export type TranslationKey = keyof typeof translations.en

export function t(key: TranslationKey, lang: Language = 'en', params?: Record<string, string | number>): string {
  const dict = translations[lang] || translations.en
  let text = dict[key] || translations.en[key] || ''
  if (params) {
    Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]))
    })
  }
  return text
}
