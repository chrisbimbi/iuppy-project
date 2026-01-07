import { FC, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { useIntl } from 'react-intl'
import { getJourneys, deleteJourney, duplicateJourney } from '../services/journeys.service'
import { Journey } from '../types'
import { KTSVG } from '../../../../helpers'
import { JourneyGeneralStats } from './JourneyGeneralStats'
import { Content } from 'src/layout/components/Content'

export const JourneyList: FC = () => {
    const intl = useIntl()
    const [journeys, setJourneys] = useState<Journey[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadJourneys()
    }, [])

    const loadJourneys = async () => {
        setLoading(true)
        try {
            const data = await getJourneys()
            setJourneys(data)
        } catch (error) {
            console.error('Failed to load journeys', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = (id: string) => {
        Swal.fire({
            title: intl.formatMessage({ id: 'JOURNEYS.DELETE.TITLE', defaultMessage: 'Are you sure?' }),
            text: intl.formatMessage({ id: 'JOURNEYS.DELETE.TEXT', defaultMessage: 'You won\'t be able to revert this!' }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: intl.formatMessage({ id: 'JOURNEYS.DELETE.CONFIRM', defaultMessage: 'Yes, delete it!' }),
            cancelButtonText: intl.formatMessage({ id: 'JOURNEYS.DELETE.CANCEL', defaultMessage: 'Cancel' })
        }).then((result) => {
            if (result.isConfirmed) {
                deleteJourney(id)
                    .then(() => {
                        // toast.success(intl.formatMessage({ id: 'JOURNEYS.DELETE.SUCCESS', defaultMessage: 'Journey deleted successfully' }))
                        Swal.fire({
                            text: intl.formatMessage({ id: 'JOURNEYS.DELETE.SUCCESS', defaultMessage: 'Journey deleted successfully' }),
                            icon: 'success',
                            buttonsStyling: false,
                            confirmButtonText: 'Ok, got it!',
                            customClass: {
                                confirmButton: 'btn btn-primary'
                            }
                        })
                        loadJourneys()
                    })
                    .catch(() => {
                        // toast.error(intl.formatMessage({ id: 'JOURNEYS.DELETE.ERROR', defaultMessage: 'Failed to delete journey' }))
                        Swal.fire({
                            text: intl.formatMessage({ id: 'JOURNEYS.DELETE.ERROR', defaultMessage: 'Failed to delete journey' }),
                            icon: 'error',
                            buttonsStyling: false,
                            confirmButtonText: 'Ok, got it!',
                            customClass: {
                                confirmButton: 'btn btn-danger'
                            }
                        })
                    })
            }
        })
    }

    const handleDuplicate = (id: string) => {
        duplicateJourney(id)
            .then(() => {
                // toast.success(intl.formatMessage({ id: 'JOURNEYS.DUPLICATE.SUCCESS', defaultMessage: 'Journey duplicated successfully' }))
                Swal.fire({
                    text: intl.formatMessage({ id: 'JOURNEYS.DUPLICATE.SUCCESS', defaultMessage: 'Journey duplicated successfully' }),
                    icon: 'success',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok, got it!',
                    customClass: {
                        confirmButton: 'btn btn-primary'
                    }
                })
                loadJourneys()
            })
            .catch(() => {
                // toast.error(intl.formatMessage({ id: 'JOURNEYS.DUPLICATE.ERROR', defaultMessage: 'Failed to duplicate journey' }))
                Swal.fire({
                    text: intl.formatMessage({ id: 'JOURNEYS.DUPLICATE.ERROR', defaultMessage: 'Failed to duplicate journey' }),
                    icon: 'error',
                    buttonsStyling: false,
                    confirmButtonText: 'Ok, got it!',
                    customClass: {
                        confirmButton: 'btn btn-danger'
                    }
                })
            })
    }

    const hasStepType = (journey: Journey, type: string) => {
        return journey.steps?.some(s => s.type === type || s.contentType === type.toUpperCase() || s.mediaType === type.toUpperCase())
    }

    const hasAck = (journey: Journey) => {
        return journey.steps?.some(s => s.requireAck)
    }

    const hasPoll = (journey: Journey) => {
        return journey.steps?.some(s => s.type === 'poll' || (s as any).pollConfig)
    }

    const hasForm = (journey: Journey) => {
        return journey.steps?.some(s => s.type === 'form' || (s as any).formConfig)
    }

    return (
        <Content>
            <div className='card'>
                <div className='card-header border-0 pt-6'>
                    <h3 className='card-title align-items-start flex-column'>
                        <span className='card-label fw-bold fs-3 mb-1'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TITLE' })}</span>
                        <span className='text-muted mt-1 fw-semibold fs-7'>{intl.formatMessage({ id: 'JOURNEYS.LIST.SUBTITLE' })}</span>
                    </h3>
                    <div className='card-toolbar'>
                        <Link to='/journeys/builder' className='btn btn-sm btn-light-primary'>
                            <i className='ki-duotone ki-plus fs-2'></i> {intl.formatMessage({ id: 'JOURNEYS.LIST.BUTTON.NEW' })}
                        </Link>
                    </div>
                </div>
                <div className='card-body py-3'>
                    <JourneyGeneralStats />
                    <div className='table-responsive'>
                        <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                            <thead>
                                <tr className='fw-bold text-muted'>
                                    <th className='min-w-150px'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.TITLE' })}</th>
                                    <th className='min-w-100px'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.TRIGGER' })}</th>
                                    <th className='min-w-100px'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.START_DATE' })}</th>
                                    <th className='min-w-100px'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.END_DATE' })}</th>
                                    <th className='min-w-80px text-center'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.VIDEO' })}</th>
                                    <th className='min-w-80px text-center'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.ACK' })}</th>
                                    <th className='min-w-80px text-center'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.POLL' })}</th>
                                    <th className='min-w-80px text-center'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.FORM' })}</th>
                                    <th className='min-w-100px'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.STATUS' })}</th>
                                    <th className='min-w-100px text-end'>{intl.formatMessage({ id: 'JOURNEYS.LIST.TABLE.ACTIONS' })}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={10} className='text-center'>
                                            {intl.formatMessage({ id: 'JOURNEYS.LIST.LOADING' })}
                                        </td>
                                    </tr>
                                )}
                                {!loading && journeys.length === 0 && (
                                    <tr>
                                        <td colSpan={10} className='text-center'>
                                            {intl.formatMessage({ id: 'JOURNEYS.LIST.EMPTY' })}
                                        </td>
                                    </tr>
                                )}
                                {journeys.map((journey) => (
                                    <tr key={journey.id}>
                                        <td>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex justify-content-start flex-column'>
                                                    <Link to={`/journeys/builder/${journey.id}`} className='text-dark fw-bold text-hover-primary fs-6'>
                                                        {journey.title}
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className='badge badge-light fw-bold'>
                                                {journey.triggerType}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-muted fw-semibold d-block fs-7'>
                                                {journey.startDate ? new Date(journey.startDate).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className='text-muted fw-semibold d-block fs-7'>
                                                {journey.endDate ? new Date(journey.endDate).toLocaleDateString() : '-'}
                                            </span>
                                        </td>
                                        <td className='text-center'>
                                            {hasStepType(journey, 'VIDEO') ? <i className="bi bi-check-circle-fill text-success"></i> : <span className="text-muted">-</span>}
                                        </td>
                                        <td className='text-center'>
                                            {hasAck(journey) ? <i className="bi bi-check-circle-fill text-success"></i> : <span className="text-muted">-</span>}
                                        </td>
                                        <td className='text-center'>
                                            {hasPoll(journey) ? <i className="bi bi-check-circle-fill text-success"></i> : <span className="text-muted">-</span>}
                                        </td>
                                        <td className='text-center'>
                                            {hasForm(journey) ? <i className="bi bi-check-circle-fill text-success"></i> : <span className="text-muted">-</span>}
                                        </td>
                                        <td>
                                            <span className={`badge badge-light-${journey.active ? 'success' : 'danger'}`}>
                                                {journey.active
                                                    ? intl.formatMessage({ id: 'JOURNEYS.STATUS.ACTIVE', defaultMessage: 'Active' })
                                                    : intl.formatMessage({ id: 'JOURNEYS.STATUS.INACTIVE', defaultMessage: 'Inactive' })
                                                }
                                            </span>
                                        </td>
                                        <td className='text-end'>
                                            <div className='d-flex justify-content-end flex-shrink-0'>
                                                <Link
                                                    to={`/journeys/builder/${journey.id}`}
                                                    className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                                    title={intl.formatMessage({ id: 'JOURNEYS.ACTION.EDIT', defaultMessage: 'Edit' })}
                                                >
                                                    <KTSVG path='../media/icons/duotune/art/art005.svg' className='svg-icon-3' />
                                                </Link>
                                                <Link
                                                    to={`/journeys/${journey.id}/analytics`}
                                                    className='btn btn-icon btn-bg-light btn-active-color-info btn-sm me-1'
                                                    title={intl.formatMessage({ id: 'JOURNEYS.ACTION.ANALYTICS', defaultMessage: 'Analytics' })}
                                                >
                                                    <KTSVG path='../media/icons/duotune/graphs/gra006.svg' className='svg-icon-3' />
                                                </Link>
                                                <button
                                                    onClick={() => handleDuplicate(journey.id)}
                                                    className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                                    title={intl.formatMessage({ id: 'JOURNEYS.ACTION.DUPLICATE', defaultMessage: 'Duplicate' })}
                                                >
                                                    <KTSVG path='../media/icons/duotune/general/gen054.svg' className='svg-icon-3' />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(journey.id)}
                                                    className='btn btn-icon btn-bg-light btn-active-color-danger btn-sm'
                                                    title={intl.formatMessage({ id: 'JOURNEYS.ACTION.DELETE', defaultMessage: 'Delete' })}
                                                >
                                                    <KTSVG path='../media/icons/duotune/general/gen027.svg' className='svg-icon-3' />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div >
        </Content>
    )
}
