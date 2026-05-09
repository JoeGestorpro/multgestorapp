import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './Shell.css'

export default function Shell({
  children,
  sidebarProps = {},
  topbarProps = {},
  contentProps = {},
  fullWidth = false,
  className = '',
  ...props
}) {
  return (
    <div className={['ds-shell', className].filter(Boolean).join(' ')} {...props}>
      <div className="ds-shell__sidebar">
        <Sidebar {...sidebarProps} />
      </div>

      <div className="ds-shell__main">
        <div className="ds-shell__topbar">
          <Topbar {...topbarProps} />
        </div>

        <main
          className={[
            'ds-shell__content',
            fullWidth && 'ds-shell__content--full'
          ].filter(Boolean).join(' ')}
          {...contentProps}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export { default as Sidebar } from './Sidebar'
export { default as Topbar } from './Topbar'