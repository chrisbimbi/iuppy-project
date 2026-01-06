import { FC } from 'react'
import { useIntl } from 'react-intl'

export const ModuleConfig: FC = () => {
    const intl = useIntl()
    return (
        <div className='card'>
            <div className='card-header'>
                <h3 className='card-title'>{intl.formatMessage({ id: 'JOURNEYS.CONFIG.TITLE' })}</h3>
            </div>
            <div className='card-body'>
                <div className='mb-10'>
                    <label className='form-label'>{intl.formatMessage({ id: 'JOURNEYS.CONFIG.LABEL.NAME' })}</label>
                    <input type='text' className='form-control' defaultValue='Journeys' />
                    <div className='form-text'>{intl.formatMessage({ id: 'JOURNEYS.CONFIG.HELP.NAME' })}</div>
                </div>
                <div className='form-check form-switch form-check-custom form-check-solid'>
                    <input className='form-check-input' type='checkbox' defaultChecked id='moduleEnabled' />
                    <label className='form-check-label' htmlFor='moduleEnabled'>
                        {intl.formatMessage({ id: 'JOURNEYS.CONFIG.LABEL.ENABLE' })}
                    </label>
                </div>
            </div>
            <div className='card-footer'>
                <button className='btn btn-primary'>{intl.formatMessage({ id: 'JOURNEYS.CONFIG.BUTTON.SAVE' })}</button>
            </div>
        </div>
    )
}
