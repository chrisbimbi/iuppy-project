import { FC, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useIntl } from 'react-intl'
import { KTSVG } from '../../../../helpers'
import { getJourneyStats, getStepStats, getUserProgress } from '../services/journeys.service'
import { InlineStatsModal } from './InlineStatsModal'

export const JourneyAnalytics: FC = () => {
    const { id } = useParams<{ id: string }>()
    const intl = useIntl()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<any>({
        totalEnrolled: 0,
        started: 0,
        active: 0,
        completed: 0,
        dropped: 0,
        avgCompletionTime: '-'
    })
    const [steps, setSteps] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [selectedStep, setSelectedStep] = useState<any>(null)

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([
            getJourneyStats(id),
            getStepStats(id),
            getUserProgress(id)
        ]).then(([statsData, stepsData, usersData]) => {
            setStats(statsData);
            setSteps(stepsData);
            setUsers(usersData);
        }).finally(() => {
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return <div className='d-flex justify-content-center py-10'><div className='spinner-border text-primary' role='status'></div></div>
    }

    return (
        <div className='card'>
            <div className='card-header border-0 pt-5'>
                <div className='card-title d-flex align-items-center'>
                    <Link to='/journeys' className='btn btn-sm btn-icon btn-light me-3'>
                        <KTSVG path='../media/icons/duotune/arrows/arr063.svg' className='svg-icon-2' />
                    </Link>
                    <div className='d-flex flex-column'>
                        <span className='card-label fw-bold fs-3 mb-1'>Journey Analytics</span>
                        <span className='text-muted mt-1 fw-semibold fs-7'>Insights for Journey ID: {id}</span>
                    </div>
                </div>
            </div>
            <div className='card-body py-3'>

                {/* Overview Cards */}
                <div className='row g-5 g-xl-8 mb-10'>
                    <div className='col-xl-2'>
                        <div className='card bg-light-primary hoverable card-xl-stretch mb-xl-8'>
                            <div className='card-body my-3'>
                                <div className='card-title fw-bold text-primary fs-5 mb-3 d-block'>Total Enrolled</div>
                                <div className='py-1'>
                                    <span className='text-dark fs-1 fw-bold me-2'>{stats.totalEnrolled}</span>
                                    <span className='fw-semibold text-muted fs-7'>Users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-xl-2'>
                        <div className='card bg-light-warning hoverable card-xl-stretch mb-xl-8'>
                            <div className='card-body my-3'>
                                <div className='card-title fw-bold text-warning fs-5 mb-3 d-block'>Active</div>
                                <div className='py-1'>
                                    <span className='text-dark fs-1 fw-bold me-2'>{stats.active}</span>
                                    <span className='fw-semibold text-muted fs-7'>Users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-xl-2'>
                        <div className='card bg-light-info hoverable card-xl-stretch mb-xl-8'>
                            <div className='card-body my-3'>
                                <div className='card-title fw-bold text-info fs-5 mb-3 d-block'>Started</div>
                                <div className='py-1'>
                                    <span className='text-dark fs-1 fw-bold me-2'>{stats.started}</span>
                                    <span className='fw-semibold text-muted fs-7'>Users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-xl-2'>
                        <div className='card bg-light-success hoverable card-xl-stretch mb-xl-8'>
                            <div className='card-body my-3'>
                                <div className='card-title fw-bold text-success fs-5 mb-3 d-block'>Completed</div>
                                <div className='py-1'>
                                    <span className='text-dark fs-1 fw-bold me-2'>{stats.completed}</span>
                                    <span className='fw-semibold text-muted fs-7'>Users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='col-xl-2'>
                        <div className='card bg-light-danger hoverable card-xl-stretch mb-xl-8'>
                            <div className='card-body my-3'>
                                <div className='card-title fw-bold text-danger fs-5 mb-3 d-block'>Dropped</div>
                                <div className='py-1'>
                                    <span className='text-dark fs-1 fw-bold me-2'>{stats.dropped}</span>
                                    <span className='fw-semibold text-muted fs-7'>Users</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Step Performance */}
                <h3 className='fw-bold mb-5'>Step Performance</h3>
                <div className='table-responsive mb-10'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                        <thead>
                            <tr className='fw-bold text-muted'>
                                <th className='min-w-150px'>Step Title</th>
                                <th className='min-w-100px'>Type</th>
                                <th className='min-w-100px'>Completion Rate</th>
                                <th className='min-w-100px'>Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {steps.map(step => (
                                <tr key={step.id}>
                                    <td><span className='text-dark fw-bold'>{step.title}</span></td>
                                    <td>
                                        <span className='badge badge-light fw-bold'>{step.type}</span>
                                    </td>
                                    <td>
                                        <div className='d-flex flex-column w-100 me-2'>
                                            <div className='d-flex flex-stack mb-2'>
                                                <span className='text-muted me-2 fs-7 fw-bold'>{step.completionRate}</span>
                                            </div>
                                            <div className='progress h-6px w-100'>
                                                <div className='progress-bar bg-primary' role='progressbar' style={{ width: step.completionRate }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {step.contentStats ? (
                                            <div className='d-flex flex-column align-items-start'>
                                                {step.contentStats.type === 'VIDEO' && (
                                                    <span className='text-dark fw-bold fs-6'>{step.contentStats.views} Views</span>
                                                )}
                                                {step.contentStats.type === 'FORM' && (
                                                    <>
                                                        <span className='text-dark fw-bold fs-6 mb-1'>{step.contentStats.submissions} Submissions</span>
                                                        <Link
                                                            to={`/journeys/${id}/steps/${step.id}/stats`}
                                                            className='btn btn-sm btn-light-primary py-1 px-3'
                                                        >
                                                            View Details
                                                        </Link>
                                                    </>
                                                )}
                                                {step.contentStats.type === 'POLL' && (
                                                    <>
                                                        <span className='text-dark fw-bold fs-6 mb-1'>{step.contentStats.votes} Votes</span>
                                                        <Link
                                                            to={`/journeys/${id}/steps/${step.id}/stats`}
                                                            className='btn btn-sm btn-light-primary py-1 px-3'
                                                        >
                                                            View Details
                                                        </Link>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                {/* Inline Stats Button */}
                                                {(step.formConfig || step.pollConfig) ? (
                                                    <div className="mt-auto pt-4 border-top border-gray-300 d-flex justify-content-end">
                                                        <Link
                                                            to={`/journeys/${id}/steps/${step.id}/stats`}
                                                            className="btn btn-sm btn-light-primary"
                                                        >
                                                            View Details <i className="bi bi-arrow-right ms-1"></i>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <span className='text-muted'>-</span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {steps.length === 0 && <tr><td colSpan={4} className='text-center text-muted'>No steps found</td></tr>}
                        </tbody>
                    </table>
                </div>

                {/* User Progress */}
                <h3 className='fw-bold mb-5'>User Progress</h3>
                <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                        <thead>
                            <tr className='fw-bold text-muted'>
                                <th className='min-w-150px'>User</th>
                                <th className='min-w-100px'>Status</th>
                                <th className='min-w-150px'>Current Step</th>
                                <th className='min-w-100px'>Progress</th>
                                <th className='min-w-100px'>Last Active</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td><span className='text-dark fw-bold'>{user.name}</span></td>
                                    <td>
                                        <span className={`badge badge-light-${user.status === 'COMPLETED' ? 'success' : user.status === 'ACTIVE' ? 'warning' : 'danger'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td><span className='text-muted fw-bold'>{user.currentStep}</span></td>
                                    <td>
                                        <div className='d-flex flex-column w-100 me-2'>
                                            <div className='d-flex flex-stack mb-2'>
                                                <span className='text-muted me-2 fs-7 fw-bold'>{user.progress}</span>
                                            </div>
                                            <div className='progress h-6px w-100'>
                                                <div className='progress-bar bg-success' role='progressbar' style={{ width: user.progress }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className='text-muted fw-bold'>{user.lastActive}</span></td>
                                </tr>
                            ))}
                            {users.length === 0 && <tr><td colSpan={5} className='text-center text-muted'>No users enrolled yet</td></tr>}
                        </tbody>
                    </table>
                </div>

            </div>

            {selectedStep && (
                <InlineStatsModal
                    show={showStatsModal}
                    onHide={() => setShowStatsModal(false)}
                    journeyId={id || ''}
                    stepId={selectedStep.id}
                    stepTitle={selectedStep.title}
                />
            )}
        </div>
    )
}
