// frontend/src/app/modules/contents/pages/ContentsPage.tsx

import React, { useEffect, useState } from 'react';
import { Content } from '../../../../layout/components/Content';
import { AsideDefault } from '../../../../layout/components/aside/AsideDefault';
import { ContentsMenu } from '../components/ContentsMenu';
import { Channel } from '@shared/types/Channel';
import { ChannelsList } from '../../channels/components/ChannelsList';
import { useAuth } from '../../auth';
import { CreateNewsDto, NewsType } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import { ChannelsService } from '../../channels/servicces/channels.service';
import { useNews } from '../../news/hooks/useNews';
import { NewsList } from '../../news/components/NewsList';
const ContentsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const { news, loading, error } = useNews({ channelId: selectedChannelId });

    useEffect(() => {
        if (currentUser) {
            fetchChannels();
        }
    }, [currentUser]);

    const fetchChannels = async () => {
        try {
            console.log('CURRENT USER companyId >>>>  ' + currentUser!.companyId)
            console.log('CURRENT USER userId >>>>  ' + currentUser!.id)
            const response = await ChannelsService.getChannels();
            console.log('Canais retornados do backend:', response);
            const filteredChannels = response.filter((channel: Channel) => channel.companyId === currentUser?.companyId);
            console.log('Canais filtrados:', filteredChannels);
            setChannels(filteredChannels);
        } catch (error) {
            console.error('Erro ao buscar canais:', error);
        }
    };

    const handleChannelSelect = (channelId: string) => {
        setSelectedChannelId(channelId);
    };

    const handleCreateChannel = () => {
        console.log('Criar novo canal');
        // Aqui você pode, por exemplo, abrir um modal ou redirecionar para a rota de criação de canal
    };

    const handleEditChannel = (channelId: string) => {
        console.log('Editar canal:', channelId);
        // Aqui você pode redirecionar para uma página de edição ou abrir um modal de edição
    };

    const initialValues: CreateNewsDto = {
        title: '',
        subtitle: '',
        content: '',
        type: NewsType.ANNOUNCEMENT,
        authorId: '',
        channelId: '',
        attachments: [],
        highlightImages: [],
        settings: {
            visibility: 'public',
            allowComments: true,
            moderateComments: false,
            allowReactions: true,
            notifyUsers: false,
            pushNotification: false,
            emailNotification: false,
            allowSharing: true,
            showAuthor: true,
            showPublishDate: true,
            pinToTop: false,
            schedulePublication: false,
            expirePublication: false,
            pushTitle: '',
            pushContent: '',
            expirationDate: undefined,
            schedulePublishDate: undefined,
            targetAudience: []
        },
        isPublished: false
    };

    const handleCreateContent = () => {
        navigate('/contents/news/create');
    };

    return (
        <div className="app-container container-xxl">
            <div className="app-page flex-column flex-row-fluid" id="kt_app_page">
                <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                    <AsideDefault />
                    <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                        <Content>
                            <div className="row">
                                {/* Menu lateral (3 colunas) */}
                                <div className="col-md-3">
                                    <ContentsMenu />
                                </div>
                                {/* Área principal (9 colunas) */}
                                <div className="col-md-9">
                                    <div className="card card-xl-stretch mb-5">
                                        <div className="card-header border-0 pt-5 d-flex flex-wrap justify-content-between">
                                            <div>
                                                <h3 className="card-title fw-bold fs-3 mb-1">Filtros de Segmentação</h3>
                                                <div className="d-flex gap-2 mt-3">
                                                    <select className="form-select">
                                                        <option value="All">Todos Locais</option>
                                                        <option value="Matriz">Matriz</option>
                                                        <option value="Filial1">Filial 1</option>
                                                    </select>
                                                    <select className="form-select">
                                                        <option value="All">Todos Grupos</option>
                                                        <option value="Diretoria">Diretoria</option>
                                                        <option value="RH">RH</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <button className="btn btn-sm btn-primary mt-4" onClick={handleCreateContent}>
                                                    Criar Conteúdo
                                                </button>
                                            </div>
                                        </div>
                                        <div className="card-body pt-5">
                                            <ChannelsList
                                                channels={channels}
                                                selectedChannelId={selectedChannelId}
                                                onChannelSelect={handleChannelSelect}
                                                onCreateChannel={handleCreateChannel}
                                                onEditChannel={handleEditChannel}
                                            />
                                            <NewsList news={news} loading={loading} error={error} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Content>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentsPage;