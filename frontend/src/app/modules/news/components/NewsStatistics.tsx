import React, { useEffect, useState } from 'react';
import { newsApi, NewsStatistics as NewsStatisticsType } from '../services/newsApi';
import { useIntl } from 'react-intl';

interface NewsStatisticsProps {
  newsId: string;
}

export const NewsStatistics: React.FC<NewsStatisticsProps> = ({ newsId }) => {
  const intl = useIntl();
  const [statistics, setStatistics] = useState<NewsStatisticsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const data = await newsApi.getStatistics(newsId);
        setStatistics(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [newsId]);

  const handleExportUnopened = async () => {
    try {
      const unopenedUsers = await newsApi.getUnopenedUsers(newsId);
      // Convert to CSV and download
      const csv = unopenedUsers.map(user => `${user.id},${user.name},${user.email}`).join('\n');
      const blob = new Blob([`ID,Nome,Email\n${csv}`], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `unopened-users-${newsId}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting unopened users:', error);
    }
  };

  if (loading) {
    return <div className="text-center p-10">{intl.formatMessage({ id: 'NEWS.STATS.LOADING', defaultMessage: 'Carregando estatísticas...' })}</div>;
  }

  if (!statistics) {
    return <div className="text-center p-10">{intl.formatMessage({ id: 'NEWS.STATS.EMPTY', defaultMessage: 'Nenhuma estatística disponível.' })}</div>;
  }

  return (
    <div className="row g-5 g-xl-8">
      {/* Audiência */}
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-50px me-5">
                <span className="symbol-label bg-light-primary">
                  <i className="bi bi-people fs-2x text-primary"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <span className="text-gray-700 fw-bold d-block fs-6">{intl.formatMessage({ id: 'NEWS.STATS.TOTAL_USERS', defaultMessage: 'Total de Usuários' })}</span>
                <span className="text-gray-900 fw-bolder d-block fs-2">{statistics.audiencia.totalUsuarios}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Com Token Ativo */}
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-50px me-5">
                <span className="symbol-label bg-light-success">
                  <i className="bi bi-phone fs-2x text-success"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <span className="text-gray-700 fw-bold d-block fs-6">{intl.formatMessage({ id: 'NEWS.STATS.ACTIVE_TOKEN', defaultMessage: 'Com Token Ativo' })}</span>
                <span className="text-gray-900 fw-bolder d-block fs-2">{statistics.audiencia.comTokenAtivo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aberturas Totais */}
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-50px me-5">
                <span className="symbol-label bg-light-info">
                  <i className="bi bi-eye fs-2x text-info"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <span className="text-gray-700 fw-bold d-block fs-6">{intl.formatMessage({ id: 'NEWS.STATS.OPENS', defaultMessage: 'Aberturas' })}</span>
                <span className="text-gray-900 fw-bolder d-block fs-2">{statistics.aberturas.total}</span>
                <span className="text-gray-500 fs-7">({statistics.aberturas.unicas} {intl.formatMessage({ id: 'NEWS.STATS.UNIQUE', defaultMessage: 'únicas' })})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACKs */}
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="symbol symbol-50px me-5">
                <span className="symbol-label bg-light-warning">
                  <i className="bi bi-check-circle fs-2x text-warning"></i>
                </span>
              </div>
              <div className="flex-grow-1">
                <span className="text-gray-700 fw-bold d-block fs-6">ACKs</span>
                <span className="text-gray-900 fw-bolder d-block fs-2">{statistics.acks.total}</span>
                <span className="text-gray-500 fs-7">({statistics.acks.unicos} {intl.formatMessage({ id: 'NEWS.STATS.UNIQUE', defaultMessage: 'únicos' })})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interações */}
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bold fs-3 mb-1">{intl.formatMessage({ id: 'NEWS.STATS.INTERACTIONS', defaultMessage: 'Interações' })}</span>
            </h3>
          </div>
          <div className="card-body py-3">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-5">
                  <h4 className="fw-semibold text-gray-800 mb-2">{intl.formatMessage({ id: 'NEWS.STATS.REACTIONS', defaultMessage: 'Reações' })}</h4>
                  {Object.entries(statistics.interacoes.reacoes).map(([type, count]) => (
                    <div key={type} className="d-flex align-items-center mb-2">
                      <span className="text-gray-700 fw-semibold me-2">{type}:</span>
                      <span className="badge badge-light-primary">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-5">
                  <h4 className="fw-semibold text-gray-800 mb-2">{intl.formatMessage({ id: 'NEWS.STATS.COMMENTS', defaultMessage: 'Comentários' })}</h4>
                  <span className="badge badge-light-success fs-3">{statistics.interacoes.comentarios}</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-5">
                  <h4 className="fw-semibold text-gray-800 mb-2">{intl.formatMessage({ id: 'NEWS.STATS.SHARES', defaultMessage: 'Compartilhamentos' })}</h4>
                  <span className="badge badge-light-info fs-3">{statistics.interacoes.compartilhamentos}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-body">
            <button className="btn btn-primary" onClick={handleExportUnopened}>
              {intl.formatMessage({ id: 'NEWS.STATS.BUTTON.EXPORT_UNOPENED', defaultMessage: 'Exportar Usuários que Não Abriram (CSV)' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

