import React from 'react'

type Props = {
    stats: {
        topNews: Array<{
            id: string
            title: string
            date: string
            cover: string
            interactions: number
        }>
        totalNews: number
    }
}

export const NewsStatsWidget: React.FC<Props> = ({ stats }) => {
    return (
        <div className='card card-xl-stretch mb-xl-8'>
            <div className='card-header border-0 py-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Conteúdos</span>
                    <span className='text-muted fw-bold fs-7'>Top Engajamento</span>
                </h3>
            </div>
            <div className='card-body pt-2'>
                {stats.topNews.map((news) => (
                    <div key={news.id} className='d-flex align-items-center mb-7'>
                        <div className='symbol symbol-50px me-5'>
                            {news.cover ? (
                                <img src={news.cover} className='' alt='' />
                            ) : (
                                <div className='symbol-label bg-light-info text-info fw-bold fs-3'>
                                    {news.title.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className='flex-grow-1'>
                            <span className='text-dark fw-bolder text-hover-primary fs-6'>{news.title}</span>
                            <span className='text-muted d-block fw-bold'>
                                {new Date(news.date).toLocaleDateString()}
                            </span>
                        </div>
                        <span className='badge badge-light-primary fw-bolder'>{news.interactions} interações</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
