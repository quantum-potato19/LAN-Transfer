import React, { useState } from 'react'
import { Laptop, Search, Smartphone } from 'lucide-react'
import { ShibaAvatar } from './ShibaAvatar'

interface Device {
  id: string
  name: string
  ip: string
  port: number
  avatarIndex: number
  isMobile?: boolean
}

interface RadarProps {
  devices: Device[]
  onSelectDevice: (device: Device) => void
  onDirectConnect?: (ip: string) => void
  onSpeedTest: (ip: string) => void
  theme?: 'dark' | 'light'
}

export const Radar: React.FC<RadarProps> = ({ devices, onSelectDevice, onDirectConnect, onSpeedTest, theme = 'dark' }) => {
  const [directIp, setDirectIp] = useState('')
  const isLight = theme === 'light'

  const handleDirectConnect = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = directIp.trim()
    if (!trimmed) return
    if (!/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(trimmed)) {
      alert('请输入有效的 IPv4 地址 (例如: 192.168.1.100)')
      return
    }
    if (onDirectConnect) {
      onDirectConnect(trimmed)
    }
  }

  return (
    <div className={`relative flex-1 h-full flex flex-col items-center justify-center p-6 overflow-hidden pb-24 ${
      isLight ? 'text-slate-800' : 'text-white'
    }`}>
      {/* Search Header Info */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className={`titlebar-no-drag absolute top-8 left-10 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border ${
          isLight 
            ? 'bg-slate-900/5 border-slate-200 text-slate-700 shadow-sm' 
            : 'bg-white/5 border-white/10 text-white/80'
        }`}
      >
        <Search className={`w-4 h-4 animate-pulse ${isLight ? 'text-blue-600' : 'text-white/60'}`} />
        <span className="text-xs font-medium">正在扫描局域网设备...</span>
      </div>

      {/* Radar Animation Rings */}
      <div className="absolute w-[500px] h-[500px] flex items-center justify-center pointer-events-none select-none">
        <div className={`absolute w-full h-full rounded-full border radar-pulse-wave ${
          isLight ? 'border-blue-500/10' : 'border-white/5'
        }`}></div>
        <div className={`absolute w-[360px] h-[360px] rounded-full border radar-pulse-wave ${
          isLight ? 'border-blue-500/15' : 'border-white/10'
        }`} style={{ animationDelay: '1s' }}></div>
        <div className={`absolute w-[220px] h-[220px] rounded-full border radar-pulse-wave ${
          isLight ? 'border-blue-500/20' : 'border-white/15'
        }`} style={{ animationDelay: '2s' }}></div>
        
        {/* Core Pulsing Center */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center border border-white/30 shadow-2xl shadow-blue-500/50">
          <Laptop className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Peer Cards Overlay Area */}
      <div className="relative z-10 w-full max-w-2xl grid grid-cols-2 sm:grid-cols-3 gap-6 justify-center items-center mt-20">
        {devices.map((device) => {
          return (
            <div
              key={device.id}
              className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center cursor-default select-none border w-full relative transition-all duration-300 ${
                isLight 
                  ? 'bg-white/85 border-slate-200/90 shadow-lg shadow-slate-200/50' 
                  : 'liquid-glass-card border-white/10'
              }`}
            >
              {/* Avatar Container with glowing hover */}
              <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center border shadow-md mb-4 group-hover:scale-105 transition-transform duration-300 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                {device.isMobile ? (
                  <div className="w-full h-full flex items-center justify-center text-sky-500">
                    <Smartphone className="w-8 h-8" />
                  </div>
                ) : (
                  <ShibaAvatar index={device.avatarIndex} size={54} />
                )}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 rounded-full ${
                  isLight ? 'border-white' : 'border-[#121214]'
                }`}></div>
              </div>
              
              {/* Device Text */}
              <div className="flex items-center gap-1 max-w-full">
                {device.isMobile && <span className="text-xs">📱</span>}
                <h3 className={`font-semibold text-sm truncate max-w-full ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {device.name}
                </h3>
              </div>
              <p className={`text-[10px] font-mono mt-1 font-semibold ${
                isLight ? 'text-blue-600' : 'text-sky-400'
              }`}>{device.ip}</p>
              
              {/* Controls */}
              <div className="flex items-center gap-2 mt-4 w-full z-20">
                <button
                  onClick={() => onSelectDevice(device)}
                  className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg transition-all font-semibold cursor-pointer border shadow-sm ${
                    isLight
                      ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-blue-600/30 hover:bg-blue-500/50 text-blue-200 border-blue-500/40'
                  }`}
                >
                  发送文件
                </button>
                <button
                  onClick={() => onSpeedTest(device.ip)}
                  className={`flex-1 text-[11px] py-1.5 px-2 rounded-lg transition-all font-semibold cursor-pointer border shadow-sm ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-emerald-600/30 hover:bg-emerald-500/50 text-emerald-200 border-emerald-500/40'
                  }`}
                >
                  🚀 测速
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {devices.length === 0 && (
        <div className={`text-center max-w-xs mt-20 select-none pointer-events-none ${
          isLight ? 'text-slate-400' : 'text-white/40'
        }`}>
          <p className="text-sm font-medium">无其他在线设备</p>
          <p className="text-xs mt-1">在其他电脑或手机上打开本应用即可自动连入</p>
        </div>
      )}

      {/* Direct IP Fallback Connection Box */}
      <form 
        onSubmit={handleDirectConnect}
        className={`absolute bottom-6 left-6 right-6 flex items-center gap-3 border p-2.5 rounded-2xl backdrop-blur-md max-w-md mx-auto z-20 shadow-lg ${
          isLight
            ? 'bg-white/90 border-slate-200 shadow-slate-200/50'
            : 'bg-white/5 border-white/10'
        }`}
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="输入局域网 IP 直连 (例: 192.168.0.6)"
            value={directIp}
            onChange={(e) => setDirectIp(e.target.value)}
            className={`w-full border rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                : 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-blue-500/50'
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={!directIp.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs px-4 py-2 rounded-xl transition-colors duration-200 shadow-sm shrink-0"
        >
          直接连接
        </button>
      </form>
    </div>
  )
}
