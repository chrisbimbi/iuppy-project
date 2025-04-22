import React from 'react';
import { KTSVG } from '../../../../helpers';

const ContentsMenu: React.FC = () => {
    return (
        <div className="card">
            <div className="card-body">
                {/*begin::Menu*/}
                <div className="menu menu-rounded menu-column menu-title-gray-700 menu-icon-gray-500 menu-arrow-gray-500 menu-bullet-gray-500 menu-arrow-gray-500 menu-state-bg fw-semibold w-250px" data-kt-menu="true">
                    {/*begin::Menu item*/}
                    <div className="menu-item menu-sub-indention menu-accordion" data-kt-menu-trigger="click">
                        {/*begin::Menu link*/}
                        <a href="#" className="menu-link py-3">
                            <span className="menu-icon">
                                <KTSVG path="../media/icons/duotune/chart-simple-2.svg" className="svg-icon-3" />
                            </span>
                            <span className="menu-title">Módulos</span>
                            <span className="menu-arrow"></span>
                        </a>
                        {/*end::Menu link*/}

                        {/*begin::Menu sub*/}
                        <div className="menu-sub menu-sub-accordion pt-3">
                            {/*begin::Menu item*/}
                            <div className="menu-item">
                                <a href="/contents/news" className="menu-link py-3">
                                    <span className="menu-bullet">
                                        <span className="bullet bullet-dot"></span>
                                    </span>
                                    <span className="menu-title">News</span>
                                </a>
                            </div>
                            {/*end::Menu item*/}

                            {/*begin::Menu item*/}
                            <div className="menu-item">
                                <a href="#" className="menu-link py-3">
                                    <span className="menu-bullet">
                                        <span className="bullet bullet-dot"></span>
                                    </span>
                                    <span className="menu-title">Eventos</span>
                                </a>
                            </div>
                            {/*end::Menu item*/}
                        </div>
                        {/*end::Menu sub*/}
                    </div>
                    {/*end::Menu item*/}

                    {/*begin::Menu item*/}
                    <div className="menu-item menu-link-indention menu-accordion" data-kt-menu-trigger="click">
                        {/*begin::Menu link*/}
                        <a href="#" className="menu-link py-3">
                            <span className="menu-icon">
                                <KTSVG path="../media/icons/duotune/general/gen002.svg" className="svg-icon-3" />
                            </span>
                            <span className="menu-title">Preferências</span>
                            <span className="menu-arrow"></span>
                        </a>
                        {/*end::Menu link*/}

                        {/*begin::Menu sub*/}
                        <div className="menu-sub menu-sub-accordion pt-3">
                            {/*begin::Menu item*/}
                            <div className="menu-item">
                                <a href="#" className="menu-link py-3">
                                    <span className="menu-bullet">
                                        <span className="bullet bullet-dot"></span>
                                    </span>
                                    <span className="menu-title">Menu</span>
                                </a>
                            </div>
                            {/*end::Menu item*/}

                            {/*begin::Menu item*/}
                            <div className="menu-item">
                                <a href="#" className="menu-link py-3">
                                    <span className="menu-bullet">
                                        <span className="bullet bullet-dot"></span>
                                    </span>
                                    <span className="menu-title">Locais</span>
                                </a>
                            </div>
                            {/*end::Menu item*/}
                        </div>
                        {/*end::Menu sub*/}
                    </div>
                    {/*end::Menu item*/}
                </div>
                {/*end::Menu*/}
            </div>
        </div>
    );
};

export { ContentsMenu };