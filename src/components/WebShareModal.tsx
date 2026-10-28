import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { X, Copy, Check, Smartphone, Power, FileUp, Sparkles } from 'lucide-react'
import { Language, t } from '../locales/i18n'

interface ConnectedDevice {
  id: string
  name: string
  ip: string
  port: number
  avatarIndex?: number
  isMobile?: boolean
}

interface WebShareModalProps {
  isOpen: boolean
  onClose: () => void
  theme?: 'dark' | 'light'
  connectedDevices?: ConnectedDevice[]
  onSelectDeviceToSend?: (device: ConnectedDevice) => void
  language?: Language
}

export function WebShareModal({ 
  isOpen, 
  onClose, 
  theme = 'dark',
  connectedDevices = [],
  onSelectDeviceToSend,
  language = 'en'
}: WebShareModalProps) {
  const [serverStatus, setServerStatus] = useState<{ isRunning: boolean; port: number; url: string; pin?: string }>({
    isRunning: false,
    port: 12139,
    url: '',
    pin: ''
  })
  const [copied, setCopied] = useState(false)
  const [sharingSuccess, setSharingSuccess] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isOpen && window.electronAPI) {
      window.electronAPI.getWebServerStatus().then(status => {
        setServerStatus(status)
      })
    }
  }, [isOpen])

  useEffect(() => {
    if (serverStatus.isRunning && serverStatus.url && canvasRef.current) {
      const qrUrl = serverStatus.pin ? `${serverStatus.url}/?pin=${serverStatus.pin}` : serverStatus.url
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 180,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).catch(err => console.error('QR code generation error:', err))
    }
  }, [serverStatus])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isLight = theme === 'light'

  const handleToggle = async () => {
    if (!window.electronAPI) return
    const res = await window.electronAPI.toggleWebServer(!serverStatus.isRunning)
    setServerStatus(res)
  }

  const handleCopy = () => {
    if (!serverStatus.url) return
    navigator.clipboard.writeText(serverStatus.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareFile = async () => {
    if (!window.electronAPI) return
    const files = await window.electronAPI.selectFiles()
    if (files && files.length > 0) {
      for (const file of files) {
        await window.electronAPI.shareFileToWeb(file.path)
      }
      setSharingSuccess(true)
      setTimeout(() => setSharingSuccess(false), 3000)
    }
  }

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 select-none titlebar-no-drag transition-colors duration-200 ${
        isLight ? 'bg-slate-900/30' : 'bg-black/60'
      } backdrop-blur-md`}
    >
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className={`border rounded-3xl w-full max-w-md p-6 shadow-2xl relative titlebar-no-drag transition-colors duration-200 animate-in fade-in zoom-in-95 ${
          isLight ? 'bg-white border-slate-200/90 text-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title={t('webShareClose', language)}
          className={`titlebar-no-drag cursor-pointer z-50 absolute top-4 right-4 p-2 rounded-xl transition ${
            isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
          }`}
        >
          <X className="w-5 h-5 pointer-events-none" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-sky-500/10 text-sky-500 border border-sky-500/20 rounded-2xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('webShareTitle', language)}</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{t('webShareSub', language)}</p>
          </div>
        </div>

        {/* Server Status Switch */}
        <div className={`border rounded-2xl p-4 mb-6 flex items-center justify-between ${
          isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-800/60 border-slate-700/50'
        }`}>
          <div className="flex items-center gap-3">
            <Power className={`w-5 h-5 ${serverStatus.isRunning ? 'text-emerald-500' : (isLight ? 'text-slate-400' : 'text-slate-500')}`} />
            <div>
              <div className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{t('webShareService', language)}</div>
              <div className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {serverStatus.isRunning ? t('webShareRunning', language) : t('webShareStopped', language)}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              serverStatus.isRunning
                ? (isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30')
                : (isLight ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-700 text-slate-300 hover:bg-slate-600')
            }`}
          >
            {serverStatus.isRunning ? t('webShareRunningBtn', language) : t('webShareStartBtn', language)}
          </button>
        </div>

        {serverStatus.isRunning ? (
          <div className="flex flex-col items-center">
            {/* Live Connected Mobile Device Badge */}
            {connectedDevices.length > 0 && (
              <div className={`w-full border rounded-2xl p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${
                isLight ? 'bg-emerald-50/90 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="truncate">
                    <div className={`text-xs font-bold truncate ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                      🟢 {t('webShareMobileConnected', language, { n: connectedDevices.length })}
                    </div>
                    <div className={`text-[10px] font-mono truncate ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {connectedDevices[0].name} · {connectedDevices[0].ip}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onSelectDeviceToSend?.(connectedDevices[0])}
                  className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shrink-0 transition active:scale-95 shadow-sm"
                >
                  {t('webShareSendToMobile', language)}
                </button>
              </div>
            )}

            {/* QR Code Container */}
            <div className={`p-3 rounded-2xl shadow-md border mb-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-white border-slate-200'
            }`}>
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <p className={`text-xs mb-3 text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('webShareScanNotice', language)}
            </p>

            {/* PIN Display */}
            {serverStatus.pin && (
              <div className={`w-full border rounded-xl p-2.5 flex items-center justify-between mb-3 ${
                isLight ? 'bg-amber-50/80 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <span className={`text-xs font-medium ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                  {t('webSharePinNotice', language)}
                </span>
                <span className="text-base font-extrabold font-mono tracking-widest text-amber-500">
                  {serverStatus.pin}
                </span>
              </div>
            )}

            {/* URL Display & Copy */}
            <div className={`w-full border rounded-xl p-2.5 flex items-center justify-between mb-5 ${
              isLight ? 'bg-slate-100/90 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <span className="text-xs font-mono text-sky-600 dark:text-sky-400 truncate mr-2 select-all font-semibold">
                {serverStatus.url}
              </span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition shrink-0 ${
                  isLight 
                    ? 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-sm' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('webShareCopied', language) : t('webShareCopy', language)}
              </button>
            </div>

            {/* Share File Action */}
            <button
              onClick={handleShareFile}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/25"
            >
              <FileUp className="w-4 h-4" />
              {t('webSharePushFiles', language)}
            </button>

            {sharingSuccess && (
              <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {t('webSharePushedSuccess', language)}
              </div>
            )}

            {/* Bottom Close Button */}
            <button
              onClick={onClose}
              className={`w-full mt-3 py-2 px-4 rounded-xl text-xs font-semibold transition ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {t('webShareClose', language)}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('webShareStartNotice', language)}
            </div>
            <button
              onClick={onClose}
              className={`w-full mt-2 py-2 px-4 rounded-xl text-xs font-semibold transition ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {t('webShareClose', language)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
