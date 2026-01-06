import React, { useState } from 'react';
import { AudienceMode } from '@shared/types/NewsSettings';
import { newsApi, AudienceProbeRequest, AudienceProbeResponse } from '../services/newsApi';
import { useIntl } from 'react-intl';

interface AudienceSegmentationFormProps {
  onAudienceChange: (audienceData: any) => void;
  initialMode?: AudienceMode;
}

export const AudienceSegmentationForm: React.FC<AudienceSegmentationFormProps> = ({
  onAudienceChange,
  initialMode = AudienceMode.COMPANY,
}) => {
  const intl = useIntl();
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
      alert(intl.formatMessage({ id: 'NEWS.AUDIENCE.ERROR.CALCULATE', defaultMessage: 'Erro ao calcular audiência. Verifique os dados e tente novamente.' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-5 mb-xl-10">
      <div className="card-header border-0 cursor-pointer">
        <div className="card-title m-0">
          <h3 className="fw-bold m-0">{intl.formatMessage({ id: 'NEWS.AUDIENCE.TITLE', defaultMessage: 'Segmentação de Audiência' })}</h3>
        </div>
      </div>

      <div className="card-body border-top p-9">
        <div className="row mb-6">
          <label className="col-lg-4 col-form-label required fw-semibold fs-6">{intl.formatMessage({ id: 'NEWS.AUDIENCE.LABEL.MODE', defaultMessage: 'Modo de Segmentação' })}</label>
          <div className="col-lg-8">
            <select
              className="form-select form-select-solid"
              value={mode}
              onChange={(e) => setMode(e.target.value as AudienceMode)}
            >
              <option value={AudienceMode.COMPANY}>{intl.formatMessage({ id: 'NEWS.AUDIENCE.MODE.COMPANY', defaultMessage: 'Empresa Inteira' })}</option>
              <option value={AudienceMode.SPACE}>{intl.formatMessage({ id: 'NEWS.AUDIENCE.MODE.SPACE', defaultMessage: 'Todos os Channels de um Space' })}</option>
              <option value={AudienceMode.CHANNEL}>{intl.formatMessage({ id: 'NEWS.AUDIENCE.MODE.CHANNEL', defaultMessage: 'Channels Específicos' })}</option>
              <option value={AudienceMode.GROUPS}>{intl.formatMessage({ id: 'NEWS.AUDIENCE.MODE.GROUPS', defaultMessage: 'Grupos Específicos' })}</option>
            </select>
          </div>
        </div>

        {mode === AudienceMode.SPACE && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">{intl.formatMessage({ id: 'NEWS.AUDIENCE.LABEL.SPACE_ID', defaultMessage: 'Space ID' })}</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder={intl.formatMessage({ id: 'NEWS.AUDIENCE.PLACEHOLDER.SPACE_ID', defaultMessage: 'Digite o ID do Space' })}
                value={spaceId}
                onChange={(e) => setSpaceId(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === AudienceMode.CHANNEL && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">{intl.formatMessage({ id: 'NEWS.AUDIENCE.LABEL.CHANNEL_IDS', defaultMessage: 'Channel IDs' })}</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder={intl.formatMessage({ id: 'NEWS.AUDIENCE.PLACEHOLDER.CHANNEL_IDS', defaultMessage: 'Digite os IDs dos Channels separados por vírgula' })}
                value={channelIds.join(',')}
                onChange={(e) => setChannelIds(e.target.value.split(',').map(id => id.trim()))}
              />
            </div>
          </div>
        )}

        {mode === AudienceMode.GROUPS && (
          <div className="row mb-6">
            <label className="col-lg-4 col-form-label fw-semibold fs-6">{intl.formatMessage({ id: 'NEWS.AUDIENCE.LABEL.GROUP_IDS', defaultMessage: 'Group IDs' })}</label>
            <div className="col-lg-8">
              <input
                type="text"
                className="form-control form-control-solid"
                placeholder={intl.formatMessage({ id: 'NEWS.AUDIENCE.PLACEHOLDER.GROUP_IDS', defaultMessage: 'Digite os IDs dos Grupos separados por vírgula' })}
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
              {loading ? intl.formatMessage({ id: 'NEWS.AUDIENCE.BUTTON.CALCULATING', defaultMessage: 'Calculando...' }) : intl.formatMessage({ id: 'NEWS.AUDIENCE.BUTTON.CALCULATE', defaultMessage: 'Calcular Audiência' })}
            </button>
          </div>
        </div>

        {audiencePreview && (
          <div className="row">
            <div className="col-lg-8 offset-lg-4">
              <div className="alert alert-info d-flex align-items-center p-5">
                <div className="d-flex flex-column">
                  <h4 className="mb-1 text-dark">{intl.formatMessage({ id: 'NEWS.AUDIENCE.PREVIEW.TITLE', defaultMessage: 'Prévia de Audiência' })}</h4>
                  <span><strong>{intl.formatMessage({ id: 'NEWS.AUDIENCE.PREVIEW.TOTAL', defaultMessage: 'Total de Usuários Elegíveis:' })}</strong> {audiencePreview.totalUsuarios}</span>
                  <span><strong>{intl.formatMessage({ id: 'NEWS.AUDIENCE.PREVIEW.ACTIVE', defaultMessage: 'Com Token Ativo:' })}</strong> {audiencePreview.comTokenAtivo}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

