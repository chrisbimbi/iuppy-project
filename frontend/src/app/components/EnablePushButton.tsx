import { useState } from 'react'
import { initPush } from '../core/push/fcm'

export default function EnablePushButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle'|'ok'|'err'>('idle')

  const onClick = async () => {
    setLoading(true)
    try {
      const res = await initPush()
      setStatus(res.ok ? 'ok' : 'err')
    } catch {
      setStatus('err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button className='btn btn-sm btn-light' disabled={loading} onClick={onClick}>
      {loading ? 'Ativando…' : 'Ativar notificações'}
      {status === 'ok' && <span className='ms-2 text-success'>✓</span>}
      {status === 'err' && <span className='ms-2 text-danger'>×</span>}
    </button>
  )
}