import React, { FC } from 'react'
import { Link } from 'react-router-dom'
import { KTIcon } from '../../../helpers'
import { useCmsNotifications } from 'src/app/modules/forms/hooks/useCmsNotifications';

const ActivityDrawer: FC = () => {
  const { items, loading, markAsRead } = useCmsNotifications();

  return (
    <div
      id='kt_activities'
      className='bg-body'
      data-kt-drawer='true'
      data-kt-drawer-name='activities'
      data-kt-drawer-activate='true'
      data-kt-drawer-overlay='true'
      data-kt-drawer-width="{default:'300px', 'lg': '600px'}"
      data-kt-drawer-direction='end'
      data-kt-drawer-toggle='#kt_activities_toggle'
      data-kt-drawer-close='#kt_activities_close'
    >
      <div className='card shadow-none rounded-0'>
        <div className='card-header' id='kt_activities_header'>
          <h3 className='card-title fw-bolder text-gray-900'>Central de Alertas</h3>
          <div className='card-toolbar'>
            <button type='button' className='btn btn-sm btn-icon btn-active-light-primary me-n5' id='kt_activities_close'>
              <KTIcon iconName='cross' className='fs-1' />
            </button>
          </div>
        </div>

        <div className='card-body position-relative' id='kt_activities_body'>
          <div id='kt_activities_scroll' className='position-relative scroll-y me-n5 pe-5' data-kt-scroll='true' data-kt-scroll-height='auto' data-kt-scroll-wrappers='#kt_activities_body' data-kt-scroll-dependencies='#kt_activities_header, #kt_activities_footer' data-kt-scroll-offset='5px'>
            <div className='timeline'>

              {loading && <div className="text-center p-5 text-muted">Carregando...</div>}

              {!loading && items.length === 0 && (
                <div className="text-center p-10 text-muted">
                  <i className="bi bi-check-circle fs-1 d-block mb-4 text-success"></i>
                  Tudo em dia! Nenhuma pendência de formulários.
                </div>
              )}

              {items.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className="timeline-line w-40px"></div>
                  <div className="timeline-icon symbol symbol-circle symbol-40px me-4">
                    <div className="symbol-label bg-light-danger">
                      <KTIcon iconName="notification-on" className="fs-2 text-danger" />
                    </div>
                  </div>
                  <div className="timeline-content mb-10 mt-n1">
                    <div className="pe-3 mb-5">
                      <div className="fs-5 fw-bold mb-2">{item.title}</div>
                      <div className="d-flex align-items-center mt-1 fs-6">
                        <div className="text-muted me-2 fs-7">
                          {item.message}
                        </div>
                        <span className="badge badge-light-danger fs-8 fw-bold my-2">
                          {item.count} Novo(s)
                        </span>
                      </div>
                    </div>
                    <div className="overflow-auto pb-5">
                      <Link
                        to={item.link}
                        className="btn btn-sm btn-light-primary fw-bolder px-4 py-2"
                        onClick={() => {
                          // 🔥 AQUI ACONTECE A MÁGICA: Clicou -> Marcou Lido -> Sai da lista
                          markAsRead(item.id);
                          document.getElementById('kt_activities_close')?.click();
                        }}
                      >
                        Visualizar & Resolver
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ActivityDrawer }