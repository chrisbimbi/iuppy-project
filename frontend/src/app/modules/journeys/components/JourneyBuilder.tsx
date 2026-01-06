import { FC } from 'react'
import { JourneyBuilderCanvas } from './builder/JourneyBuilderCanvas'

export const JourneyBuilder: FC = () => {
    return (
        <div className='card'>
            <div className='card-body'>
                <JourneyBuilderCanvas />
            </div>
        </div>
    )
}
