import React from 'react'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'

const GroupsPage: React.FC = () => {
    return (
        <div className='app-container container-xxl'>
            <div className='app-page flex-column flex-row-fluid' id='kt_app_page'>
                <div className='app-wrapper flex-column flex-row-fluid' id='kt_app_wrapper'>
                    <AsideDefault />
                    <div className='app-main flex-column flex-row-fluid' id='kt_app_main'>
                        <Content>
                            <h1>Grupos de usuário</h1>
                            <p>Este é o stub da página de Grupos — em breve aqui listaremos, criaremos e gerenciaremos membros.</p>
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GroupsPage