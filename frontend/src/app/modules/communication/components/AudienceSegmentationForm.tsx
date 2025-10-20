import React, { useState } from 'react'
import { AudienceMode } from '@shared/types/NewsSettings'
import {
  NewsAudienceService,
  AudienceProbeRequest,
  AudienceProbeResponse,
} from '../services/news-audience.service'

type Props = {
  /** devolve os campos já no formato do seu NewsSettings */
  onAudienceChange: (aud: {
    audienceMode: AudienceMode
    audienceSpaceId?: string
    audienceChannelIds?: string[]
    audienceGroupIds?: string[]
    audienceSnapshot?: AudienceProbeResponse | null
  }) => void
  initialMode?: AudienceMode
  initialSpaceId?: string
  initialChannelIds?: string[]
  initialGroupIds?: string[]
}

const AudienceSegmentationForm: React.FC<Props> = ({
  onAudienceChange,
  initialMode = AudienceMode.COMPANY,
  initialSpaceId,
  initialChannelIds,
  initialGroupIds,
}) => {
  const [mode, setMode] = useState<AudienceMode>(initialMode)
  const [spaceId, setSpaceId] = useState<string>(initialSpaceId || '')
  const [channelIds, setChannelIds] = useState<string[]>(initialChannelIds || [])
  const [groupIds, setGroupIds] = useState<string[]>(initialGroupIds || [])
  const [audiencePreview, setAudiencePreview] = useState<AudienceProbeResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCalculateAudience = async () => {
    setLoading(true)
    try {
      const req: AudienceProbeRequest = {
        mode,
        spaceId: mode === AudienceMode.SPACE ? spaceId : undefined,
        channelIds: mode === AudienceMode.CHANNEL ? channelIds : undefined,
        groupIds: mode === AudienceMode.GROUPS ? groupIds : undefined,
      }
      const result = await NewsAudienceService.probeAudience(req)
      setAudiencePreview(result)
      onAudienceChange({
        audienceMode: mode,
        audienceSpaceId: mode === AudienceMode.SPACE ? spaceId : undefined,
        audienceChannelIds: mode === AudienceMode.CHANNEL ? channelIds : undefined,
        audienceGroupIds: mode === AudienceMode.GROUPS ? groupIds : undefined,
        audienceSnapshot: result,
      })
    } catch (error) {
      console.error('Error calculating audience:', error)
      alert('Erro ao calcular audiência. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card mb-5 mb-xl-10">
      <div className="card-header border-0 cursor-pointer">
        <div className="card-title m-0">
          <h3 className="fw-bold m-0">Segmentação de Audiência</h3>
        </div>
      </div>

      <div className="card-body border-top p-9">
        <div className="row mb-6">
          <label className="col-lg-4 col-form-label required fw-semibold fs-6">Modo de Segmentação</label>
          <div className="col-lg-8">
            <select
              className="form-select form-select-solid"
              value={mode}
              onChange={(e) => setMode(e.target.value as AudienceMode)}
            >
              <option value={AudienceMode.COMPANY}>Empresa Inteira</option>
              <option value={AudienceMode.SPACE}>Todos os Channels de um Space</option>
              <option value={AudienceMode.CHANNEL}>Channels Específicos</option>
              <option value={AudienceMode.GROUPS}>Grupos Específicos</option>
            </select>
          </div>
        </div>

        {mode === AudienceMode.SPACE && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">Space ID</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder="Digite o ID do Space"
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === AudienceMode.CHANNEL && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">Channel IDs</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder="id1,id2,id3"
                value={channelIds.join(',')}
                onChange={(e) =>
                  setChannelIds(
                    e.target.value.split(',').map((id) => id.trim()).filter(Boolean)
                  )
                }
              />
            </div>
          </div>
        )}

        {mode === AudienceMode.GROUPS && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">Group IDs</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder="id1,id2,id3"
                value={groupIds.join(',')}
                onChange={(e) =>
                  setGroupIds(
                    e.target.value.split(',').map((id) => id.trim()).filter(Boolean)
                  )
                }
              />
            </div>
          </div>
        )}

        <div className="row mb-6">
          <div className="col-lg-8 offset-lg-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCalculateAudience}
              disabled={loading}
            >
              {loading ? 'Calculando...' : 'Calcular Audiência'}
            </button>
          </div>
        </div>

        {audiencePreview && (
          <div className="row">
            <div className="col-lg-8 offset-lg-4">
              <div className="alert alert-info d-flex align-items-center p-5">
                <div className="d-flex flex-column">
                  <h4 className="mb-1 text-dark">Prévia de Audiência</h4>
                  <span>
                    <strong>Total de Usuários Elegíveis:</strong> {audiencePreview.totalUsuarios}
                  </span>
                  <span>
                    <strong>Com Token Ativo:</strong> {audiencePreview.comTokenAtivo}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AudienceSegmentationForm
