import React, { useState, useEffect } from 'react';
import { ErrorMessage, FormikErrors, FormikTouched } from 'formik';
import { CreateNewsDto } from '@shared/types';
import { useIntl } from 'react-intl';
import { KTSVG } from '../../../../../helpers';
import { Modal } from 'bootstrap';

type StepProps = {
  data: CreateNewsDto;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
  errors: FormikErrors<CreateNewsDto>;
  touched: FormikTouched<CreateNewsDto>;
};

export const Step2: React.FC<StepProps> = ({ data, setFieldValue, errors, touched }) => {
  const [pushModal, setPushModal] = useState<Modal | null>(null);
  const intl = useIntl();

  useEffect(() => {
    const modalElement = document.getElementById('kt_modal_push_notification');
    if (modalElement) {
      setPushModal(new Modal(modalElement));
    }
  }, []);

  const handleSettingsChange = (field: string, value: any) => {
    setFieldValue('settings', {
      ...data.settings,
      [field]: value
    });
  };

  const handlePushNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSettingsChange('pushNotification', e.target.checked);
    if (e.target.checked && pushModal) {
      pushModal.show();
    }
  };

  return (
    <div className='w-100'>
      <div className='pb-10 pb-lg-15'>
        <h2 className='fw-bolder text-dark'>Opções de Publicação</h2>
        <div className='text-gray-400 fw-bold fs-6'>
          Configure as opções de publicação do seu new
        </div>
      </div>

      <div className='row mb-10'>
        <div className='col-md-6'>
          <label className='form-label required'>Público Alvo</label>
          <input
            name='targetAudience'
            className={`form-control form-control-lg form-control-solid ${touched.settings?.targetAudience && errors.settings?.targetAudience ? 'is-invalid' : ''}`}
            value={data.settings?.targetAudience.join(', ')}
            onChange={(e) => setFieldValue('targetAudience', e.target.value.split(',').map(item => item.trim()))}
          />
          <ErrorMessage name='targetAudience' component='div' className='invalid-feedback' />
        </div>
        <div className='col-md-6'>
          <label className='form-label'>Visibilidade</label>
          <select
            className='form-select form-select-lg form-select-solid'
            value={data.settings.visibility}
            onChange={(e) => handleSettingsChange('visibility', e.target.value)}
          >
            <option value='public'>Público</option>
            <option value='private'>Privado</option>
            <option value='specific_groups'>Grupos Específicos</option>
          </select>
        </div>
      </div>

      <div className='row'>
        <div className='col-md-6'>
          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='isPublished'
                checked={data.isPublished}
                onChange={(e) => setFieldValue('isPublished', e.target.checked)}
              />
              <label className='form-check-label'>
                Publicar imediatamente
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.allowComments'
                checked={data.settings.allowComments}
                onChange={(e) => handleSettingsChange('allowComments', e.target.checked)}
              />
              <label className='form-check-label'>
                Permitir comentários
              </label>
            </div>
          </div>

          {data.settings.allowComments && (
            <div className='fv-row mb-10'>
              <div className='form-check form-switch form-check-custom form-check-solid'>
                <input
                  className='form-check-input'
                  type='checkbox'
                  name='settings.moderateComments'
                  checked={data.settings.moderateComments}
                  onChange={(e) => handleSettingsChange('moderateComments', e.target.checked)}
                />
                <label className='form-check-label'>
                  Moderar comentários
                </label>
              </div>
            </div>
          )}

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.allowReactions'
                checked={data.settings.allowReactions}
                onChange={(e) => handleSettingsChange('allowReactions', e.target.checked)}
              />
              <label className='form-check-label'>
                Permitir reações
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.notifyUsers'
                checked={data.settings.notifyUsers}
                onChange={(e) => handleSettingsChange('notifyUsers', e.target.checked)}
              />
              <label className='form-check-label'>
                Notificar usuários
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.showPublishDate'
                checked={data.settings.showPublishDate}
                onChange={(e) => handleSettingsChange('showPublishDate', e.target.checked)}
              />
              <label className='form-check-label'>
                Mostrar data de publicação
              </label>
            </div>
          </div>
        </div>

        <div className='col-md-6'>
          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.pushNotification'
                checked={data.settings.pushNotification}
                onChange={handlePushNotificationChange}
              />
              <label className='form-check-label'>
                Enviar notificação push
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.emailNotification'
                checked={data.settings.emailNotification}
                onChange={(e) => handleSettingsChange('emailNotification', e.target.checked)}
              />
              <label className='form-check-label'>
                Enviar notificação por e-mail
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.allowSharing'
                checked={data.settings.allowSharing}
                onChange={(e) => handleSettingsChange('allowSharing', e.target.checked)}
              />
              <label className='form-check-label'>
                Permitir compartilhamento
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.showAuthor'
                checked={data.settings.showAuthor}
                onChange={(e) => handleSettingsChange('showAuthor', e.target.checked)}
              />
              <label className='form-check-label'>
                Mostrar autor
              </label>
            </div>
          </div>


          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.pinToTop'
                checked={data.settings.pinToTop}
                onChange={(e) => handleSettingsChange('pinToTop', e.target.checked)}
              />
              <label className='form-check-label'>
                Fixar no topo
              </label>
            </div>
          </div>

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.schedulePublication'
                checked={data.settings.schedulePublication}
                onChange={(e) => handleSettingsChange('schedulePublication', e.target.checked)}
              />
              <label className='form-check-label'>
                Agendar publicação
              </label>
            </div>
          </div>

          {data.settings.schedulePublication && (
            <div className='fv-row mb-10'>
              <label className='form-label'>Data de Publicação</label>
              <input
                type='datetime-local'
                className='form-control form-control-lg form-control-solid'
                value={data.settings.schedulePublishDate ? new Date(data.settings.schedulePublishDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleSettingsChange('schedulePublishDate', new Date(e.target.value))}
              />
            </div>
          )}

          <div className='fv-row mb-10'>
            <div className='form-check form-switch form-check-custom form-check-solid'>
              <input
                className='form-check-input'
                type='checkbox'
                name='settings.expirePublication'
                checked={data.settings.expirePublication}
                onChange={(e) => handleSettingsChange('expirePublication', e.target.checked)}
              />
              <label className='form-check-label'>
                Expirar publicação
              </label>
            </div>
          </div>

          {data.settings.expirePublication && (
            <div className='fv-row mb-10'>
              <label className='form-label'>Data de Expiração</label>
              <input
                type='datetime-local'
                className='form-control form-control-lg form-control-solid'
                value={data.settings.expirationDate ? new Date(data.settings.expirationDate).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleSettingsChange('expirationDate', new Date(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal para configuração de notificação push */}
      <div className='modal fade' tabIndex={-1} id='kt_modal_push_notification'>
        <div className='modal-dialog'>
          <div className='modal-content'>
            <div className='modal-header'>
              <h5 className='modal-title'>Configurar Notificação Push</h5>
              <div
                className='btn btn-icon btn-sm btn-active-light-primary ms-2'
                data-bs-dismiss='modal'
                aria-label='Close'
              >
                <KTSVG
                  path='/media/icons/duotune/arrows/arr061.svg'
                  className='svg-icon svg-icon-2x'
                />
              </div>
            </div>
            <div className='modal-body'>
              <div className='mb-10'>
                <label className='form-label'>Título do Push</label>
                <input
                  type='text'
                  className='form-control'
                  value={data.settings.pushTitle || ''}
                  onChange={(e) => handleSettingsChange('pushTitle', e.target.value)}
                />
              </div>
              <div className='mb-10'>
                <label className='form-label'>Conteúdo do Push</label>
                <textarea
                  className='form-control'
                  rows={3}
                  value={data.settings.pushContent || ''}
                  onChange={(e) => handleSettingsChange('pushContent', e.target.value)}
                />
              </div>
            </div>
            <div className='modal-footer'>
              <button
                type='button'
                className='btn btn-light'
                data-bs-dismiss='modal'
              >
                Fechar
              </button>
              <button
                type='button'
                className='btn btn-primary'
                data-bs-dismiss='modal'
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};