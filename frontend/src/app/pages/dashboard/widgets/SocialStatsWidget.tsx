import React from 'react'

type Props = {
    stats: {
        totalPosts: number
        totalInteractions: number
        engagementRate: string | number
    }
    leaderboard?: Array<{
        userId: string
        name: string
        avatar: string
        posts: number
        interactions: number
        user?: { name: string, avatarUrl: string } // Fallback if backend sends nested
    }>
}

export const SocialStatsWidget: React.FC<Props> = ({ stats, leaderboard }) => {
    return (
        <div className='card card-xl-stretch mb-xl-8'>
            <div className='card-header border-0 py-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Social Wall</span>
                    <span className='text-muted fw-bold fs-7'>Engajamento</span>
                </h3>
            </div>
            <div className='card-body py-3 d-flex flex-column'>
                <div className="row mb-5">
                    <div className="col border-end text-center">
                        <div className="fs-1 fw-bolder text-dark">{stats.totalPosts}</div>
                        <div className="fs-7 fw-bold text-muted">Posts</div>
                    </div>
                    <div className="col border-end text-center">
                        <div className="fs-1 fw-bolder text-dark">{stats.totalInteractions}</div>
                        <div className="fs-7 fw-bold text-muted">Interações</div>
                    </div>
                    <div className="col text-center">
                        <div className="fs-1 fw-bolder text-primary">{stats.engagementRate}</div>
                        <div className="fs-7 fw-bold text-muted">Engajamento</div>
                    </div>
                </div>

                <div className="separator mb-5"></div>

                <h4 className="card-title fw-bolder text-dark fs-5 mb-3">Top Criadores</h4>
                {leaderboard?.map((u, i) => {
                    const name = u.user?.name || u.name;
                    const avatar = u.user?.avatarUrl || u.avatar;
                    const count = u.posts || 0; // Or u.count if mapped

                    return (
                        <div key={i} className='d-flex align-items-center mb-5'>
                            <div className='symbol symbol-30px me-3'>
                                {avatar ? (
                                    <img src={avatar} alt={name} />
                                ) : (
                                    <span className="symbol-label bg-light-success text-success fw-bold">
                                        {name?.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="flex-grow-1">
                                <div className="text-gray-800 fw-bolder fs-6">{name}</div>
                            </div>
                            <div className="badge badge-light fw-bolder">{count} posts</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
