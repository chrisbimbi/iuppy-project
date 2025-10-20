import React, { useState } from 'react';
import { AudienceMode } from '@shared/types/NewsSettings';
import { newsApi, AudienceProbeRequest, AudienceProbeResponse } from '../services/newsApi';

interface AudienceSegmentationFormProps {
  onAudienceChange: (audienceData: any) => void;
  initialMode?: AudienceMode;
}

export const AudienceSegmentationForm: React.FC<AudienceSegmentationFormProps> = ({
  onAudienceChange,
  initialMode = AudienceMode.COMPANY,
}) => {
  const [mode, setMode] = useState<AudienceMode>(initialMode);
  const [spaceId, setSpaceId] = useState<string>('');
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [audiencePreview, setAudiencePreview] = useState<AudienceProbeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculateAudience = async () => {
    setLoading(true);
    try {
      const request: AudienceProbeRequest = {
        mode,
        spaceId: mode === AudienceMode.SPACE ? spaceId : undefined,
        channelIds: mode === AudienceMode.CHANNEL ? channelIds : undefined,
        groupIds: mode === AudienceMode.GROUPS ? groupIds : undefined,
      };
      const result = await newsApi.probeAudience(request);
      setAudiencePreview(result);
      onAudienceChange({
        mode,
        spaceId: mode === AudienceMode.SPACE ? spaceId : undefined,
        channelIds: mode === AudienceMode.CHANNEL ? channelIds : undefined,
        groupIds: mode === AudienceMode.GROUPS ? groupIds : undefined,
        audienceSnapshot: result,
      });
    } catch (error) {
      console.error('Error calculating audience:', error);
      alert('Erro ao calcular audiência. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
                placeholder="Digite os IDs dos Channels separados por vírgula"
                value={channelIds.join(',')}
                onChange={(e) => setChannelIds(e.target.value.split(',').map(id => id.trim()))}
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
                placeholder="Digite os IDs dos Grupos separados por vírgula"
                value={groupIds.join(',')}
                onChange={(e) => setGroupIds(e.target.value.split(',').map(id => id.trim()))}
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
                  <span><strong>Total de Usuários Elegíveis:</strong> {audiencePreview.totalUsuarios}</span>
                  <span><strong>Com Token Ativo:</strong> {audiencePreview.comTokenAtivo}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

