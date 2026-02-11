import React from 'react'
import { SpacesList } from '../views/SpacesList'
import { PageTitle } from 'src/layout/core'
import { useAuth } from '../../auth'

const SpacesPage: React.FC = () => {
    const { currentUser } = useAuth()

    if (!currentUser?.companyId) {
        return <div>Loading...</div>
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Spaces</PageTitle>
            <SpacesList companyId={currentUser.companyId} />
        </>
    )
}

export default SpacesPage
