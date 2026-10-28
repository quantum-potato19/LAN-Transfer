import { useEffect, useState, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Radar } from './components/Radar'
import { FileList } from './components/FileList'
import { DynamicIsland } from './components/DynamicIsland'
import { WebShareModal } from './components/WebShareModal'
import { 
  FileText, 
  Check, 
  ArrowRightLeft, 
  Laptop, 
  CheckCircle, 
  XCircle,
  History as HistoryIcon,
  Play,
  Pause,
  X,
  AlertTriangle
} from 'lucide-react'
import { ShibaAvatar } from './components/ShibaAvatar'
import { Language, t } from './locales/i18n'

// TS interface definitions for electron API
declare global {
  interface Window {
    electronAPI: {
      selectFiles: () => Promise<{ path: string; name: string; size: number }[]>;
      selectDirectoryToSend: () => Promise<{ path: string; name: string; size: number }[]>;
      sendFiles: (targetIp: string, files: { path: string; name: string; size: number }[], transferId: string) => Promise<{ success: boolean; error?: string }>;
      acceptTransfer: (id: string, accept: boolean) => Promise<boolean>;
      getMyNickname: () => Promise<string>;
      setMyNickname: (nickname: string) => Promise<string>;
      getMyIp: () => Promise<string>;
      getMyAvatarIndex: () => Promise<number>;
      setMyAvatarIndex: (idx: number) => Promise<number>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      forceCloseWindow: () => void;
      selectDirectory: () => Promise<string | null>;
      getSaveDir: () => Promise<string>;
      setSaveDir: (dir: string) => Promise<string>;
      pauseTransfer: (id: string) => Promise<boolean>;
      resumeTransfer: (id: string) => Promise<boolean>;
      cancelTransfer: (id: string) => Promise<boolean>;
      getWebServerStatus: () => Promise<{ isRunning: boolean; port: number; url: string; pin?: string }>;
      toggleWebServer: (enable: boolean) => Promise<{ isRunning: boolean; port: number; url: string; pin?: string }>;
      shareFileToWeb: (filePath: string) => Promise<boolean>;
      startSpeedTest: (targetIp: string) => Promise<{ success: boolean; speedMbps?: number; error?: string }>;
      onDeviceListUpdate: (callback: (devices: any[]) => void) => () => void;
      onTransferProgress: (callback: (data: any) => void) => () => void;
      onIncomingTransfer: (callback: (data: { id: string; senderName: string; files: any[]; totalSize: number }) => void) => () => void;
      onConfirmAppClose: (callback: () => void) => () => void;
    }
  }
}

interface SelectedFile {
  path: string
  name: string
  size: number
}

interface Device {
  id: string
  name: string
  ip: string
  port: number
  avatarIndex: number
}

interface TransferRecord {
  id: string
  fileName: string
  totalSize: number
  peerName: string
  direction: 'incoming' | 'outgoing'
  status: 'completed' | 'failed' | 'declined' | 'cancelled'
  time: string
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatSpeed = (bytesPerSec: number): string => {
  return formatSize(bytesPerSec) + '/s'
}

const formatRemainingTime = (totalSeconds: number, lang: Language = 'en'): string => {
  if (lang === 'en') {
    if (totalSeconds < 60) return `${totalSeconds}s`
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
    }
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`
  }
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return seconds > 0 ? `${minutes} 分 ${seconds} 秒` : `${minutes} 分`
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  return minutes > 0 ? `${hours} 小时 ${minutes} 分` : `${hours} 小时`
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'settings' | 'transferring'>('send')
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  
  const [myNickname, setMyNickname] = useState('')
  const [tempNickname, setTempNickname] = useState('')
  const [myAvatarIndex, setMyAvatarIndex] = useState(0)
  const [myIp, setMyIp] = useState('127.0.0.1')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'en'
  })
  
  // Transfers states
  const [incomingTransfer, setIncomingTransfer] = useState<{ id: string; senderName: string; files: any[]; totalSize: number } | null>(null)
  const [transferState, setTransferState] = useState<any>(null)
  const [history, setHistory] = useState<TransferRecord[]>([])
  const [saveDir, setSaveDir] = useState('Downloads (下载) 目录')
  const [isWebShareOpen, setIsWebShareOpen] = useState(false)
  const [speedTestState, setSpeedTestState] = useState<{ isRunning: boolean; speedMbps?: number; progress?: number; targetIp?: string } | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showAppCloseConfirm, setShowAppCloseConfirm] = useState(false)

  // Tracking speed calculations
  const lastTimeRef = useRef(Date.now())
  const lastBytesRef = useRef(0)
  const lastSpeedRef = useRef(0)
  const cancelledIdsRef = useRef<Set<string>>(new Set())
  const completedIdsRef = useRef<Set<string>>(new Set())

  const speedTestCancelledRef = useRef(false)

  const requestCancelTransfer = () => {
    if (!transferState) return
    setShowCancelConfirm(true)
  }

  const handleStartSpeedTest = async (targetIp: string) => {
    speedTestCancelledRef.current = false
    setSpeedTestState({ isRunning: true, progress: 0, speedMbps: 0, targetIp })
    
    const res = await window.electronAPI.startSpeedTest(targetIp)
    if (speedTestCancelledRef.current) {
      return
    }
    if (res.success && res.speedMbps !== undefined) {
      setSpeedTestState(prev => {
        if (!prev) return null
        return {
          ...prev,
          isRunning: false,
          progress: 1,
          speedMbps: res.speedMbps
        }
      })
    } else {
      setSpeedTestState(null)
      alert(`测速失败: ${res.error || '握手超时或网络中断'}`)
    }
  }

  const handleCloseSpeedTest = () => {
    speedTestCancelledRef.current = true
    setSpeedTestState(null)
  }

  useEffect(() => {
    // 1. Fetch info
    window.electronAPI.getMyNickname().then(name => {
      setMyNickname(name)
      setTempNickname(name)
    })
    window.electronAPI.getMyIp().then(ip => setMyIp(ip))
    window.electronAPI.getSaveDir().then(dir => setSaveDir(dir))
    window.electronAPI.getMyAvatarIndex().then(idx => setMyAvatarIndex(idx))

    // 2. Setup mDNS peer updates
    const unsubscribeDevices = window.electronAPI.onDeviceListUpdate((peerList) => {
      setDevices(peerList)
    })

    // 3. Setup incoming transfer request listener
    const unsubscribeIncoming = window.electronAPI.onIncomingTransfer((data) => {
      setIncomingTransfer(data)
    })

    // 4. Setup progress listener
    const unsubscribeProgress = window.electronAPI.onTransferProgress((data) => {
      if (data.isSpeedTest) {
        setSpeedTestState(prev => {
          if (!prev) return null
          return {
            ...prev,
            isRunning: true,
            progress: data.progress,
            speedMbps: data.currentMbps || 0
          }
        })
        return
      }

      // Skip ALL events for transfers that have been cancelled
      if (cancelledIdsRef.current.has(data.id)) {
        return
      }

      if (data.status === 'cancelled') {
        cancelledIdsRef.current.add(data.id)
        handleTransferComplete({
          id: data.id,
          direction: data.direction,
          totalSize: data.totalSize
        }, 'cancelled')
        if (data.direction === 'incoming') {
          setTimeout(() => {
            alert(`传输方（${data.senderName || '对方'}）中止传输`)
          }, 50)
        }
        return
      }

      const now = Date.now()
      const timeDelta = (now - lastTimeRef.current) / 1000 // seconds
      const targetBytes = data.bytesTransferred !== undefined ? data.bytesTransferred : lastBytesRef.current
      const bytesDelta = targetBytes - lastBytesRef.current

      let calculatedSpeed = lastSpeedRef.current
      if (timeDelta > 0.2 && !data.isPaused) {
        calculatedSpeed = bytesDelta / timeDelta
        lastTimeRef.current = now
        lastBytesRef.current = targetBytes
        lastSpeedRef.current = calculatedSpeed
      }

      setTransferState((prev: any) => {
        const isCurrentlyPaused = data.isPaused !== undefined ? data.isPaused : (prev && prev.status === 'paused')
        const currentSpeed = isCurrentlyPaused ? 0 : calculatedSpeed
        const currentStatus = isCurrentlyPaused ? 'paused' : (data.direction === 'outgoing' ? 'sending' : 'receiving')
        return {
          id: data.id,
          direction: data.direction,
          progress: data.progress !== undefined ? data.progress : (prev?.progress || 0),
          speed: currentSpeed,
          bytesTransferred: targetBytes,
          totalSize: data.totalSize !== undefined ? data.totalSize : (prev?.totalSize || 0),
          status: currentStatus,
          peerName: prev?.peerName || '设备'
        }
      })

      // Complete or fail states
      if (data.progress !== undefined && data.progress >= 1) {
        handleTransferComplete(data, 'completed')
      }
    })

    const unsubscribeClose = window.electronAPI.onConfirmAppClose ? window.electronAPI.onConfirmAppClose(() => {
      setShowAppCloseConfirm(true)
    }) : () => {}

    return () => {
      unsubscribeDevices()
      unsubscribeIncoming()
      unsubscribeProgress()
      unsubscribeClose()
    }
  }, [])

  // Global ESC key listener to close topmost active modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAppCloseConfirm) {
          setShowAppCloseConfirm(false)
          return
        }
        if (showCancelConfirm) {
          setShowCancelConfirm(false)
          return
        }
        if (speedTestState) {
          handleCloseSpeedTest()
          return
        }
        if (selectedDevice && selectedFiles.length > 0) {
          setSelectedDevice(null)
          setSelectedFiles([])
          return
        }
        if (isWebShareOpen) {
          setIsWebShareOpen(false)
          return
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAppCloseConfirm, showCancelConfirm, speedTestState, selectedDevice, selectedFiles, isWebShareOpen])

  const handleTransferComplete = (data: any, status: 'completed' | 'failed' | 'declined' | 'cancelled') => {
    // Skip if this transfer was already cancelled or already completed
    if (status !== 'cancelled' && (cancelledIdsRef.current.has(data.id) || completedIdsRef.current.has(data.id))) {
      return
    }

    if (status === 'completed') {
      completedIdsRef.current.add(data.id)
      if (completedIdsRef.current.size > 100) {
        completedIdsRef.current.clear()
      }
      if (cancelledIdsRef.current.size > 100) {
        cancelledIdsRef.current.clear()
      }
    }

    // Add to history (capped to 100 records)
    const isOutgoing = data.direction === 'outgoing'
    const newRecord: TransferRecord = {
      id: data.id,
      fileName: isOutgoing ? selectedFiles[0]?.name || '多个文件' : incomingTransfer?.files[0]?.name || '多个文件',
      totalSize: data.totalSize,
      peerName: isOutgoing ? selectedDevice?.name || '对端' : incomingTransfer?.senderName || '对端',
      direction: data.direction,
      status,
      time: new Date().toLocaleTimeString()
    }

    setHistory(prev => {
      if (prev.some(item => item.id === data.id)) {
        return prev
      }
      return [newRecord, ...prev].slice(0, 100)
    })

    if (status === 'cancelled') {
      // Immediately clear everything synchronously
      setTransferState(null)
      if (isOutgoing) {
        setSelectedDevice(null)
        setSelectedFiles([])
      } else {
        setIncomingTransfer(null)
      }
    } else {
      // Update status in Dynamic Island
      setTransferState((prev: any) => prev ? { ...prev, status } : null)

      // Clear after 3 seconds
      setTimeout(() => {
        setTransferState(null)
        if (isOutgoing) {
          setSelectedDevice(null)
          setSelectedFiles([])
        } else {
          setIncomingTransfer(null)
        }
      }, 3000)
    }

    lastBytesRef.current = 0
  }

  const handlePause = async () => {
    if (!transferState) return
    await window.electronAPI.pauseTransfer(transferState.id)
    setTransferState((prev: any) => prev ? { ...prev, status: 'paused' } : null)
  }

  const handleResume = async () => {
    if (!transferState) return
    await window.electronAPI.resumeTransfer(transferState.id)
    setTransferState((prev: any) => prev ? { ...prev, status: prev.direction === 'outgoing' ? 'sending' : 'receiving' } : null)
    lastTimeRef.current = Date.now()
  }

  const handleCancel = async () => {
    if (!transferState) return
    cancelledIdsRef.current.add(transferState.id)
    // Immediately close popup and record
    handleTransferComplete({
      id: transferState.id,
      direction: transferState.direction,
      totalSize: transferState.totalSize
    }, 'cancelled')
    await window.electronAPI.cancelTransfer(transferState.id)
  }

  // Click on a peer avatar to choose files
  const handleSelectDevice = async (device: Device) => {
    setSelectedDevice(device)
    const files = await window.electronAPI.selectFiles()
    if (files && files.length > 0) {
      setSelectedFiles(files)
    } else {
      setSelectedDevice(null)
    }
  }

  // Fallback Direct IP connection and file sending
  const handleDirectConnect = async (ip: string) => {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(ip.trim())) {
      alert('请输入有效的 IP 地址')
      return
    }

    const files = await window.electronAPI.selectFiles()
    if (files && files.length > 0) {
      setSelectedFiles(files)
      setSelectedDevice({
        id: `direct-${ip}`,
        name: `直连设备`,
        ip: ip,
        port: 12138,
        avatarIndex: 0
      })
    }
  }

  const handleAddMoreFiles = async () => {
    const files = await window.electronAPI.selectFiles()
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleAddMoreFolders = async () => {
    const files = await window.electronAPI.selectDirectoryToSend()
    if (files && files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSendFiles = async () => {
    if (!selectedDevice || selectedFiles.length === 0) return

    const transferId = Math.random().toString(36).substring(2, 9)

    // Trigger Dynamic Island starting state
    setTransferState({
      id: transferId,
      direction: 'outgoing',
      progress: 0,
      speed: 0,
      bytesTransferred: 0,
      totalSize: selectedFiles.reduce((acc, f) => acc + f.size, 0),
      status: 'sending',
      peerName: selectedDevice.name
    })

    lastTimeRef.current = Date.now()
    lastBytesRef.current = 0

    const result = await window.electronAPI.sendFiles(selectedDevice.ip, selectedFiles, transferId)
    
    if (!result.success && !cancelledIdsRef.current.has(transferId)) {
      const failStatus = result.error === 'Rejected by receiver' ? 'declined' : 'failed'
      handleTransferComplete({
        id: transferId,
        direction: 'outgoing',
        totalSize: selectedFiles.reduce((acc, f) => acc + f.size, 0)
      }, failStatus)
    }
    cancelledIdsRef.current.delete(transferId)
  }

  const handleAcceptIncoming = async (accept: boolean) => {
    if (!incomingTransfer) return
    
    if (accept) {
      setTransferState({
        id: incomingTransfer.id,
        direction: 'incoming',
        progress: 0,
        speed: 0,
        bytesTransferred: 0,
        totalSize: incomingTransfer.totalSize,
        status: 'receiving',
        peerName: incomingTransfer.senderName
      })
      lastTimeRef.current = Date.now()
      lastBytesRef.current = 0
    }
    
    await window.electronAPI.acceptTransfer(incomingTransfer.id, accept)
    
    if (!accept) {
      setIncomingTransfer(null)
    }
  }

  const handleSaveNickname = async () => {
    if (tempNickname.trim()) {
      const saved = await window.electronAPI.setMyNickname(tempNickname)
      setMyNickname(saved)
    }
  }
  const hasActiveTransfer = !!(transferState && (transferState.status === 'sending' || transferState.status === 'receiving' || transferState.status === 'paused'))

  return (
    <div className={`relative w-screen h-screen overflow-hidden flex justify-center items-center bg-transparent p-2 font-sans select-none ${theme === 'dark' ? 'theme-dark' : 'theme-light'}`}>
      {/* Main Container */}
      <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 flex liquid-glass-panel relative flex-col shadow-2xl">
        {/* Dynamic blurred iOS mesh background blobs — wrapped in clip-path container to prevent blur bleeding outside rounded corners */}
        <div className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" style={{ clipPath: 'inset(0 round 1.5rem)' }}>
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-purple-600/25 rounded-full blur-[120px]"></div>
          <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-indigo-500/15 rounded-full blur-[100px]"></div>
        </div>
        
        {/* Windows style top header/titlebar */}
        <div className="titlebar-drag h-12 w-full flex items-center justify-between pl-6 pr-2 border-b border-white/5 relative z-30 select-none">
          <div className="text-[11px] text-white/40 font-semibold tracking-widest uppercase">LAN Transfer</div>
          
          {/* Windows-style Window Controls on the right */}
          <div className="titlebar-no-drag flex items-center h-full">
            <button 
              onClick={() => window.electronAPI.minimizeWindow()}
              className={`w-12 h-12 flex items-center justify-center transition-colors duration-150 ${
                theme === 'light' ? 'text-slate-600 hover:bg-black/5' : 'text-white/70 hover:bg-white/10'
              }`}
              title="最小化"
            >
              <span className={`w-3.5 h-[1.5px] ${theme === 'light' ? 'bg-slate-700' : 'bg-white'}`}></span>
            </button>
            <button 
              onClick={() => window.electronAPI.maximizeWindow()}
              className={`w-12 h-12 flex items-center justify-center transition-colors duration-150 ${
                theme === 'light' ? 'text-slate-600 hover:bg-black/5' : 'text-white/70 hover:bg-white/10'
              }`}
              title="最大化"
            >
              <span className={`w-3 h-3 border bg-transparent ${theme === 'light' ? 'border-slate-700' : 'border-white'}`}></span>
            </button>
            <button 
              onClick={() => window.electronAPI.closeWindow()}
              className={`w-12 h-12 flex items-center justify-center transition-colors duration-150 ${
                theme === 'light' ? 'text-slate-600 hover:bg-red-600 hover:text-white' : 'text-white/70 hover:bg-red-600 hover:text-white'
              }`}
              title="关闭"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 10 10">
                <path d="M 0,0 L 10,10 M 10,0 L 0,10" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
            </button>
          </div>
        </div>

        {/* Dynamic Island Status Pill */}
        <DynamicIsland 
          transferState={transferState} 
          onPause={handlePause}
          onResume={handleResume}
          onCancel={requestCancelTransfer}
          language={language}
        />

        {/* App Main Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            myNickname={myNickname}
            myAvatarIndex={myAvatarIndex}
            myIp={myIp}
            hasActiveTransfer={hasActiveTransfer}
            onOpenWebShare={() => setIsWebShareOpen(true)}
            language={language}
          />

          {/* Tab Pages */}
          <div className="flex-1 h-full bg-black/10 overflow-y-auto relative">
            
            {/* 1. SEND VIEW */}
            {activeTab === 'send' && (
              <Radar 
                devices={devices} 
                onSelectDevice={handleSelectDevice} 
                onDirectConnect={handleDirectConnect} 
                onSpeedTest={handleStartSpeedTest} 
                theme={theme}
                language={language}
              />
            )}

            {/* 2. HISTORY VIEW */}
            {activeTab === 'history' && (
              <div className="p-8 text-white max-w-3xl mx-auto h-full flex flex-col">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                  <span>{t('historyTitle', language)}</span>
                </h2>
                
                {history.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-white/30">
                    <HistoryIcon className="w-12 h-12 stroke-[1.5] mb-2" />
                    <p className="text-sm">{t('historyEmpty', language)}</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                    {history.map((record) => (
                      <div 
                        key={record.id}
                        className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                            record.direction === 'outgoing' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-green-500/10 border-green-500/20 text-green-400'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold truncate max-w-[200px]" title={record.fileName}>
                              {record.fileName}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {record.direction === 'outgoing' ? t('historySentTo', language) : t('historyReceivedFrom', language)} <span className="font-bold text-white/60">{record.peerName}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right flex-shrink-0">
                          <div>
                            <p className="text-xs font-semibold">{formatSize(record.totalSize)}</p>
                            <p className="text-[9px] text-white/30 mt-0.5 font-mono">{record.time}</p>
                          </div>
                          
                          {record.status === 'completed' ? (
                            <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              {t('historySuccess', language)}
                            </span>
                          ) : record.status === 'cancelled' ? (
                            <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-semibold">
                              <XCircle className="w-3 h-3 text-yellow-400" />
                              {t('historyCancelled', language)}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 font-semibold">
                              <XCircle className="w-3 h-3" />
                              {record.status === 'declined' ? t('historyDeclined', language) : t('historyFailed', language)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. TRANSFERRING VIEW */}
            {activeTab === 'transferring' && (
              <div className="p-8 text-white max-w-2xl mx-auto h-full flex flex-col justify-center items-center">
                {hasActiveTransfer ? (
                  <div className="w-full liquid-glass-card p-8 rounded-3xl border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow-md">
                          <ShibaAvatar index={transferState.direction === 'outgoing' ? 0 : 3} size={42} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-white">
                            {transferState.direction === 'outgoing' 
                              ? `${t('transSendingTo', language)} ${transferState.peerName}` 
                              : `${t('transReceivingFrom', language)} ${transferState.peerName}`}
                          </h3>
                          <p className="text-xs text-white/50 mt-1 flex items-center gap-2">
                            <span>{t('transSize', language)}: {formatSize(transferState.totalSize)}</span>
                            <span>•</span>
                            <span>{t('transTransferred', language)}: {formatSize(transferState.bytesTransferred)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold text-white/80 uppercase">
                          {transferState.status === 'paused' ? (
                            <span className="text-yellow-400">{t('transPaused', language)}</span>
                          ) : transferState.direction === 'outgoing' ? (
                            <span className="text-blue-400">{t('transSending', language)}</span>
                          ) : (
                            <span className="text-green-400">{t('transReceiving', language)}</span>
                          )}
                        </div>
                        <div className="text-xl font-black font-mono mt-1 text-blue-400">
                          {Math.round(transferState.progress * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 mt-2">
                      <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5 p-[1px]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            transferState.status === 'paused'
                              ? 'bg-yellow-500'
                              : transferState.direction === 'outgoing'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${transferState.progress * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-white/40 font-mono">
                        <span>{t('transSpeed', language)}: {transferState.status === 'paused' ? '0 B/s' : formatSpeed(transferState.speed)}</span>
                        <span>
                          {transferState.status === 'paused'
                            ? t('transPaused', language)
                            : transferState.speed > 0
                            ? `${t('islandRemaining', language)}: ${formatRemainingTime(Math.ceil((transferState.totalSize - transferState.bytesTransferred) / transferState.speed), language)}`
                            : t('islandCalculating', language)}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-4 mt-4 justify-end">
                      {transferState.status === 'paused' ? (
                        <button
                          onClick={handleResume}
                          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold tracking-wider text-white shadow-lg transition-all duration-200 border border-white/10 flex items-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t('transContinue', language)}</span>
                        </button>
                      ) : (
                        <button
                          onClick={handlePause}
                          className="px-6 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 active:scale-95 text-xs font-bold tracking-wider text-white shadow-lg transition-all duration-200 border border-white/10 flex items-center gap-2"
                        >
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>{t('transPause', language)}</span>
                        </button>
                      )}
                      
                      <button
                        onClick={requestCancelTransfer}
                        className={`px-6 py-2.5 rounded-xl border active:scale-95 text-xs font-bold tracking-wider transition-all duration-200 flex items-center gap-2 ${
                          theme === 'light'
                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-sm'
                            : 'bg-red-600/20 hover:bg-red-600/30 border-red-500/30 text-red-300'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{t('transAbort', language)}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/30 p-8 border border-dashed border-white/10 rounded-3xl w-full py-16 bg-white/5">
                    <ArrowRightLeft className="w-12 h-12 stroke-[1.5] mb-4 text-white/20 animate-pulse" />
                    <p className="text-sm font-semibold text-white/50">{t('transNoActive', language)}</p>
                    <p className="text-xs text-white/30 mt-1">{t('transNoActiveSub', language)}</p>
                  </div>
                )}
              </div>
            )}

            {/* 3. SETTINGS VIEW */}
            {activeTab === 'settings' && (
              <div className="p-8 text-white max-w-xl mx-auto">
                <h2 className="text-xl font-bold mb-8">{t('settingsTitle', language)}</h2>

                <div className="space-y-6">
                  {/* Nickname modification */}
                  <div className="space-y-2">
                    <label className="text-xs text-white/50 font-semibold tracking-wider uppercase block">{t('settingsNickname', language)}</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={tempNickname}
                        onChange={(e) => setTempNickname(e.target.value)}
                        placeholder={t('settingsNicknamePlaceholder', language)}
                        maxLength={20}
                        className="flex-1 bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all duration-300 placeholder-white/30"
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={!tempNickname.trim() || tempNickname === myNickname}
                        className="px-6 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 border border-white/10 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-xs font-semibold text-white shadow-lg transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {t('settingsUpdate', language)}
                      </button>
                    </div>
                  </div>

                  {/* Avatar choosing */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/50 font-semibold tracking-wider uppercase block">{t('settingsAvatar', language)}</label>
                    <div className="grid grid-cols-6 gap-3">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setMyAvatarIndex(idx)
                            window.electronAPI.setMyAvatarIndex(idx)
                          }}
                          className={`w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center border relative transition-all duration-300 hover:scale-105 active:scale-95 ${
                            myAvatarIndex === idx ? 'border-white ring-2 ring-blue-500 scale-105' : 'border-white/10'
                          }`}
                        >
                          <ShibaAvatar index={idx} size={42} />
                          {myAvatarIndex === idx && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border border-white/50">
                              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme settings */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/50 font-semibold tracking-wider uppercase block">{t('settingsTheme', language)}</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setTheme('dark')
                          localStorage.setItem('theme', 'dark')
                        }}
                        className={`flex-1 py-3 rounded-2xl border text-center transition-all duration-300 font-semibold text-xs ${
                          theme === 'dark'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        {t('settingsThemeDark', language)}
                      </button>
                      <button
                        onClick={() => {
                          setTheme('light')
                          localStorage.setItem('theme', 'light')
                        }}
                        className={`flex-1 py-3 rounded-2xl border text-center transition-all duration-300 font-semibold text-xs ${
                          theme === 'light'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        {t('settingsThemeLight', language)}
                      </button>
                    </div>
                  </div>

                  {/* Language settings */}
                  <div className="space-y-3">
                    <label className="text-xs text-white/50 font-semibold tracking-wider uppercase block">{t('settingsLanguage', language)}</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setLanguage('en')
                          localStorage.setItem('language', 'en')
                        }}
                        className={`flex-1 py-3 rounded-2xl border text-center transition-all duration-300 font-semibold text-xs ${
                          language === 'en'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        {t('settingsLangEn', language)}
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('zh')
                          localStorage.setItem('language', 'zh')
                        }}
                        className={`flex-1 py-3 rounded-2xl border text-center transition-all duration-300 font-semibold text-xs ${
                          language === 'zh'
                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        {t('settingsLangZh', language)}
                      </button>
                    </div>
                  </div>

                  {/* System details */}
                  <div className="pt-6 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div>
                        <span className="text-[11px] text-white/40 uppercase block">{t('settingsLocalIp', language)}</span>
                        <span className="text-sm font-semibold font-mono mt-0.5 block">{myIp}</span>
                      </div>
                      <Laptop className="w-5 h-5 text-white/30" />
                    </div>

                    <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl">
                      <div className="flex-1 mr-4 overflow-hidden">
                        <span className="text-[11px] text-white/40 uppercase block">{t('settingsSaveDir', language)}</span>
                        <span className="text-xs font-semibold text-white/80 mt-0.5 block truncate" title={saveDir}>{saveDir}</span>
                      </div>
                      <button
                        onClick={async () => {
                          const dir = await window.electronAPI.selectDirectory()
                          if (dir) {
                            const saved = await window.electronAPI.setSaveDir(dir)
                            setSaveDir(saved)
                          }
                        }}
                        className="bg-white/10 hover:bg-white/15 active:scale-95 text-xs text-white border border-white/15 px-4 py-2 rounded-lg transition-all shrink-0"
                      >
                        {t('settingsChange', language)}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overlays / Modal Windows */}
            
            {/* 1. File List Preview Overlay */}
            {selectedDevice && selectedFiles.length > 0 && (
              <FileList
                files={selectedFiles}
                targetDevice={selectedDevice}
                onRemoveFile={handleRemoveFile}
                onAddMoreFiles={handleAddMoreFiles}
                onAddMoreFolders={handleAddMoreFolders}
                onCancel={() => {
                  setSelectedDevice(null)
                  setSelectedFiles([])
                }}
                onSend={handleSendFiles}
                theme={theme}
                language={language}
              />
            )}

            {/* 2. Incoming transfer request modal */}
            {incomingTransfer && !transferState && (
              <div 
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                className={`absolute inset-0 flex items-center justify-center p-6 z-40 animate-fade-in titlebar-no-drag transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/30'
                } backdrop-blur-md`}
              >
                <div 
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                  className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl flex flex-col titlebar-no-drag transition-colors duration-200 ${
                    theme === 'dark' ? 'liquid-glass-panel border-white/20 text-white' : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
                  }`}
                >
                  
                  <div className={`flex flex-col items-center text-center pb-4 mb-4 border-b ${
                    theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                  }`}>
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center border shadow mb-3 ${
                      theme === 'dark' ? 'bg-white/5 border-white/20' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <ShibaAvatar index={0} size={54} />
                    </div>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t('incomingTitle', language)}</h3>
                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
                      {t('incomingFrom', language)} <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{incomingTransfer.senderName}</span>
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl mb-6 text-xs text-center border ${
                    theme === 'dark' ? 'bg-white/5 border-white/5 text-white/60' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <p>{t('incomingWantsToSend', language)}</p>
                    <p className={`font-bold text-sm mt-1.5 truncate max-w-xs ${
                      theme === 'dark' ? 'text-white/95' : 'text-slate-900'
                    }`} title={incomingTransfer.files[0]?.name}>
                      {incomingTransfer.files[0]?.name} {incomingTransfer.files.length > 1 ? t('incomingAndOthers', language, { n: incomingTransfer.files.length }) : ''}
                    </p>
                    <p className="text-[10px] text-blue-500 font-mono mt-1 font-semibold">{t('totalSize', language)}: {formatSize(incomingTransfer.totalSize)}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAcceptIncoming(false)}
                      className="flex-1 py-3 rounded-2xl bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-500 font-semibold border border-red-500/25 text-sm transition-all duration-300"
                    >
                      {t('incomingDecline', language)}
                    </button>
                    <button
                      onClick={() => handleAcceptIncoming(true)}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:scale-95 text-white font-semibold border border-white/10 shadow-lg shadow-blue-500/25 text-sm transition-all duration-300"
                    >
                      {t('incomingAccept', language)}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </div>

        {/* Web Share QR Modal */}
        <WebShareModal 
          isOpen={isWebShareOpen} 
          onClose={() => setIsWebShareOpen(false)} 
          theme={theme}
          connectedDevices={devices.filter(d => (d as any).isMobile || d.port === 12139)}
          onSelectDeviceToSend={(device) => {
            setSelectedDevice(device as any)
            setIsWebShareOpen(false)
            handleAddMoreFiles()
          }}
          language={language}
        />

        {/* Speedtest Dashboard Modal (Adaptive Light/Dark Theme, No Spin Circle, Big Rolling Mbps) */}
        {speedTestState && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseSpeedTest()
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 select-none titlebar-no-drag transition-colors duration-200 ${
              theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/30'
            } backdrop-blur-md`}
          >
            <div 
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className={`rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden border titlebar-no-drag transition-colors duration-200 ${
                theme === 'dark' ? 'bg-[#1e293b] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              {/* Close Button at top-right (ALWAYS visible) */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCloseSpeedTest()
                }}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                title={t('close', language)}
                className={`titlebar-no-drag cursor-pointer z-50 absolute top-4 right-4 p-2 rounded-xl transition ${
                  theme === 'dark'
                    ? 'text-white/40 hover:text-white hover:bg-white/10'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5 pointer-events-none" />
              </button>

              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              {/* Header */}
              <h3 className={`font-extrabold text-base mb-1 flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <span>{t('speedTestTitle', language)}</span>
              </h3>
              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                {t('speedTestTarget', language)}: <span className="font-mono font-semibold text-sky-500">{speedTestState.targetIp}</span> {t('speedTestPureThroughput', language)}
              </p>
              
              {/* Speed Display Card (No Spinner Circle) */}
              <div className={`w-full py-5 px-4 rounded-2xl mb-4 border flex flex-col items-center justify-center ${
                theme === 'dark' ? 'bg-[#0f172a] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`}>
                  {speedTestState.isRunning ? t('speedTestRealtime', language) : t('speedTestAverage', language)}
                </span>
                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl font-black font-mono text-sky-500 tracking-tight">
                    {(speedTestState.speedMbps || 0).toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-sky-500">Mbps</span>
                </div>
                <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                  {t('speedTestApprox', language)} {((speedTestState.speedMbps || 0) / 8).toFixed(1)} MB/s
                </span>
              </div>

              {/* Progress Line */}
              <div className={`w-full h-2 rounded-full overflow-hidden mb-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}>
                <div 
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-full transition-all duration-150" 
                  style={{ width: `${(speedTestState.progress || 0) * 100}%` }}
                ></div>
              </div>

              {/* Dynamic Status & Diagnostics */}
              {speedTestState.isRunning ? (
                <div className="flex flex-col items-center gap-3 w-full my-2">
                  <p className="text-xs text-sky-500 animate-pulse font-medium">{t('speedTestRunning', language)}</p>
                  <button
                    onClick={handleCloseSpeedTest}
                    className={`text-xs px-4 py-1.5 rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {t('speedTestCancel', language)}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Performance Diagnostics Box */}
                  <div className={`text-left text-[11px] p-3 rounded-xl border leading-relaxed ${
                    (speedTestState.speedMbps || 0) < 220
                      ? (theme === 'dark' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-900')
                      : (theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-900')
                  }`}>
                    {(speedTestState.speedMbps || 0) < 220 ? (
                      <div>
                        <p className="font-bold mb-1">{t('speedTestSlowTitle', language, { mbps: (speedTestState.speedMbps || 0).toFixed(0) })}</p>
                        <p>{t('speedTestSlowTip1', language)}</p>
                        <p className="mt-0.5">{t('speedTestSlowTip2', language)}</p>
                      </div>
                    ) : (
                      <p className="font-semibold text-center">{t('speedTestGoodNotice', language)}</p>
                    )}
                  </div>

                  <button
                    onClick={handleCloseSpeedTest}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs py-2.5 rounded-xl border border-white/10 transition-all duration-200 shadow-lg shadow-blue-500/20"
                  >
                    {t('speedTestOk', language)}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Transfer Confirmation Modal */}
        {showCancelConfirm && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCancelConfirm(false)
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 select-none titlebar-no-drag transition-colors duration-200 ${
              theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/30'
            } backdrop-blur-md`}
          >
            <div 
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className={`rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden border titlebar-no-drag transition-colors duration-200 animate-in fade-in zoom-in-95 ${
                theme === 'dark' ? 'bg-[#1e293b] border-white/10 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className={`font-bold text-lg mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('cancelTitle', language)}
              </h3>
              <p className={`text-xs mb-6 leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                {t('cancelDesc', language)}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {t('cancelBack', language)}
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false)
                    handleCancel()
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-red-500/25 transition-all"
                >
                  {t('cancelConfirm', language)}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* App Exit Confirmation Modal during Active Transfer */}
        {showAppCloseConfirm && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAppCloseConfirm(false)
            }}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            className={`fixed inset-0 flex items-center justify-center z-50 p-4 select-none titlebar-no-drag transition-colors duration-200 ${
              theme === 'dark' ? 'bg-black/60' : 'bg-slate-900/30'
            } backdrop-blur-md`}
          >
            <div 
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              className={`rounded-3xl p-6 w-full max-w-sm flex flex-col items-center text-center shadow-2xl relative overflow-hidden border titlebar-no-drag transition-colors duration-200 animate-in fade-in zoom-in-95 ${
                theme === 'dark' ? 'bg-[#1e293b] border-white/10 text-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className={`font-bold text-lg mb-1.5 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                {t('closeTitle', language)}
              </h3>
              <p className={`text-xs mb-6 leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                {t('closeDesc', language)}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowAppCloseConfirm(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {t('closeContinue', language)}
                </button>
                <button
                  onClick={() => {
                    setShowAppCloseConfirm(false)
                    window.electronAPI.forceCloseWindow()
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-red-500/25 transition-all"
                >
                  {t('closeForceExit', language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
