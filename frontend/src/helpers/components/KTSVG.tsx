import { FC } from 'react'
import SVG from 'react-inlinesvg'
import { toAbsoluteUrl } from '../assetHelpers'
type Props = {
  className?: string
  path: string
  svgClassName?: string
}

export const KTSVG: FC<Props> = ({ className = '', path, svgClassName = 'mh-50px' }) => {
  return (
    <span className={`svg-icon ${className}`}>
      <SVG src={toAbsoluteUrl(path)} className={svgClassName} />
    </span>
  )
}