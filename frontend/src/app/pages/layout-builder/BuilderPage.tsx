
import clsx from 'clsx'
import React, {useState} from 'react'
import {KTIcon} from '../../..//helpers'
import {getLayout, ILayout, LayoutSetup, useLayout} from '../../..//layout/core'
import { Toolbar } from '../../..//layout/components/toolbar/Toolbar'
import { Content } from '../../..//layout/components/Content'

const BuilderPage: React.FC = () => {
  const {setLayout} = useLayout()
  const [tab, setTab] = useState('Header')
  const [config, setConfig] = useState<ILayout>(getLayout())
  const [configLoading, setConfigLoading] = useState<boolean>(false)
  const [resetLoading, setResetLoading] = useState<boolean>(false)

  const updateData = (fieldsToUpdate: Partial<ILayout>) => {
    const updatedData = {...config, ...fieldsToUpdate}
    setConfig(updatedData)
  }

  const updateConfig = () => {
    setConfigLoading(true)
    try {
      LayoutSetup.setConfig(config)
    } catch (error) {
      setConfig(getLayout())
    }
    setTimeout(() => {
      setLayout(config)
      setConfigLoading(false)
    }, 1000)
  }

  const reset = () => {
    setResetLoading(true)
    setTimeout(() => {
      setConfig(getLayout())
      setResetLoading(false)
    }, 1000)
  }

  return (
    <>
      <Toolbar />
      <Content>
        <div className='card mb-10'>
          <div className='card-body d-flex align-items-center py-8'>
            {/* begin::Icon */}
            <div className='d-flex h-80px w-80px flex-shrink-0 flex-center position-relative'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                className='text-primary h-75px w-75px h-lg-100px w-lg-100px position-absolute opacity-5'
              >
                <path
                  fill='currentColor'
                  d='M10.2,21.23,4.91,18.17a3.58,3.58,0,0,1-1.8-3.11V8.94a3.58,3.58,0,0,1,1.8-3.11L10.2,2.77a3.62,3.62,0,0,1,3.6,0l5.29,3.06a3.58,3.58,0,0,1,1.8,3.11v6.12a3.58,3.58,0,0,1-1.8,3.11L13.8,21.23A3.62,3.62,0,0,1,10.2,21.23Z'
                ></path>
              </svg>
              <KTIcon iconName='wrench' className='fs-2x fs-lg-3x text-primary position-absolute' />
            </div>
            {/* end::Icon */}

            {/* begin::Description */}
            <div className='ms-6'>
              <p className='list-unstyled text-gray-600 fw-bold fs-6 p-0 m-0'>
                The layout builder is to assist your set and configure your preferred project layout
                specifications and preview it in real-time.
              </p>
              <p className='list-unstyled text-gray-600 fw-bold fs-6 p-0 m-0'>
                Also, you can configurate the Layout in the code (
                <code>src//layout/core/DefaultLayoutConfig.ts</code> file). Don't forget
                clear your local storage when you are changing DefaultLayoutConfig.
              </p>
            </div>
            {/* end::Description */}
          </div>
        </div>
        <div className='card card-custom'>
          <div className='card-header card-header-stretch overflow-auto'>
            <ul
              className='nav nav-stretch nav-line-tabs fw-bold border-transparent flex-nowrap'
              role='tablist'
            >
              <li className='nav-item'>
                <a
                  className={clsx(`nav-link cursor-pointer`, {
                    active: tab === 'Header',
                  })}
                  onClick={() => setTab('Header')}
                  role='tab'
                >
                  Header
                </a>
              </li>

              <li className='nav-item'>
                <a
                  className={clsx(`nav-link cursor-pointer`, {
                    active: tab === 'PageTitle',
                  })}
                  onClick={() => setTab('PageTitle')}
                  role='tab'
                >
                  Page Title
                </a>
              </li>
              <li className='nav-item'>
                <a
                  className={clsx(`nav-link cursor-pointer`, {
                    active: tab === 'Aside',
                  })}
                  onClick={() => setTab('Aside')}
                  role='tab'
                >
                  Aside
                </a>
              </li>
              <li className='nav-item'>
                <a
                  className={clsx(`nav-link cursor-pointer`, {
                    active: tab === 'Content',
                  })}
                  onClick={() => setTab('Content')}
                  role='tab'
                >
                  Content
                </a>
              </li>
              <li className='nav-item'>
                <a
                  className={clsx(`nav-link cursor-pointer`, {
                    active: tab === 'Footer',
                  })}
                  onClick={() => setTab('Footer')}
                  role='tab'
                >
                  Footer
                </a>
              </li>
            </ul>
          </div>
          {/* end::Header */}

          {/* begin::Form */}
          <form className='form'>
            {/* begin::Body */}
            <div className='card-body'>
              <div className='tab-content pt-3'>
                <div className={clsx('tab-pane', {active: tab === 'Header'})}>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Fixed Header:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <label className='form-check form-check-custom form-check-solid form-switch mb-5'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          name='layout-builder[layout][header][fixed][desktop]'
                          checked={config.header.fixed.desktop}
                          onChange={() =>
                            updateData({
                              header: {
                                ...config.header,
                                fixed: {
                                  ...config.header.fixed,
                                  desktop: !config.header.fixed.desktop,
                                },
                              },
                            })
                          }
                        />
                        <span className='form-check-label text-muted'>Desktop</span>
                      </label>

                      <label className='form-check form-check-custom form-check-solid form-switch mb-3'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          checked={config.header.fixed.tabletAndMobile}
                          onChange={() =>
                            updateData({
                              header: {
                                ...config.header,
                                fixed: {
                                  ...config.header.fixed,
                                  tabletAndMobile: !config.header.fixed.tabletAndMobile,
                                },
                              },
                            })
                          }
                        />
                        <span className='form-check-label text-muted'>Tablet & Mobile</span>
                      </label>

                      <div className='form-text text-muted'>Enable fixed header</div>
                    </div>
                  </div>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Width:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <select
                        className='form-select form-select-solid'
                        name='layout-builder[layout][header][width]'
                        value={config.header.width}
                        onChange={(e) =>
                          updateData({
                            header: {
                              ...config.header,
                              width: e.target.value as 'fixed' | 'fluid',
                            },
                          })
                        }
                      >
                        <option value='fluid'>Fluid</option>
                        <option value='fixed'>Fixed</option>
                      </select>
                      <div className='form-text text-muted'>Select header width type.</div>
                    </div>
                  </div>
                </div>
                <div className={clsx('tab-pane', {active: tab === 'PageTitle'})}>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Display:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <div className='form-check form-check-custom form-check-solid form-switch mb-2'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          name='layout-builder[layout][pageTitle][display]'
                          checked={config.pageTitle?.display}
                          onChange={() =>
                            updateData({
                              pageTitle: {
                                ...config.pageTitle!,
                                display: !config.pageTitle?.display,
                              },
                            })
                          }
                        />
                      </div>
                      <div className='form-text text-muted'>Display page title</div>
                    </div>
                  </div>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Breadcrumb:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <div className='form-check form-check-custom form-check-solid form-switch mb-2'>
                        <input
                          className='form-check-input'
                          type='checkbox'
                          name='layout-builder[layout][pageTitle][breadCrumbs]'
                          checked={config.pageTitle?.breadCrumbs}
                          onChange={() =>
                            updateData({
                              pageTitle: {
                                ...config.pageTitle!,
                                breadCrumbs: !config.pageTitle?.breadCrumbs,
                              },
                            })
                          }
                        />
                      </div>
                      <div className='form-text text-muted'>Display page title</div>
                    </div>
                  </div>
                </div>

                <div className={clsx('tab-pane', {active: tab === 'Content'})}>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Width:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <select
                        className='form-select form-select-solid'
                        name='layout-builder[layout][content][width]'
                        value={config.content.width}
                        onChange={(e) =>
                          updateData({
                            content: {
                              ...config.content,
                              width: e.target.value as 'fixed' | 'fluid',
                            },
                          })
                        }
                      >
                        <option value='fluid'>Fluid</option>
                        <option value='fixed'>Fixed</option>
                      </select>
                      <div className='form-text text-muted'>Select layout width type.</div>
                    </div>
                  </div>
                </div>

                <div className={clsx('tab-pane', {active: tab === 'Aside'})}>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Fixed:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <div className='switch switch-icon'>
                        <div className='form-check form-check-custom form-check-solid form-switch mb-2'>
                          <input
                            className='form-check-input'
                            type='checkbox'
                            name='layout-builder[layout][aside][fixed]'
                            checked={config.aside.fixed}
                            onChange={() =>
                              updateData({
                                aside: {
                                  ...config.aside,
                                  fixed: !config.aside.fixed,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className='form-text text-muted'>Enable fixed aside</div>
                    </div>
                  </div>
                </div>

                <div className={clsx('tab-pane', {active: tab === 'Footer'})}>
                  <div className='row mb-10'>
                    <label className='col-lg-3 col-form-label text-lg-end'>Width:</label>
                    <div className='col-lg-9 col-xl-4'>
                      <select
                        className='form-select form-select-solid'
                        name='layout-builder[layout][footer][width]'
                        value={config.footer.width}
                        onChange={(e) =>
                          updateData({
                            footer: {
                              ...config.footer,
                              width: e.target.value as 'fixed' | 'fluid',
                            },
                          })
                        }
                      >
                        <option value='fluid'>Fluid</option>
                        <option value='fixed'>Fixed</option>
                      </select>
                      <div className='form-text text-muted'>Select layout width type.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end::Body */}

            {/* begin::Footer */}
            <div className='card-footer py-6'>
              <div className='row'>
                <div className='col-lg-3'></div>
                <div className='col-lg-9'>
                  <button type='button' onClick={updateConfig} className='btn btn-primary me-2'>
                    {!configLoading && <span className='indicator-label'>Preview</span>}
                    {configLoading && (
                      <span className='indicator-progress' style={{display: 'block'}}>
                        Please wait...{' '}
                        <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                      </span>
                    )}
                  </button>

                  <button
                    type='button'
                    id='kt_layout_builder_reset'
                    className='btn btn-active-light btn-color-muted'
                    onClick={reset}
                  >
                    {!resetLoading && <span className='indicator-label'>Reset</span>}
                    {resetLoading && (
                      <span className='indicator-progress' style={{display: 'block'}}>
                        Please wait...{' '}
                        <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* end::Footer */}
          </form>
          {/* end::Form */}
        </div>
      </Content>
    </>
  )
}

export {BuilderPage}
