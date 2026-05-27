const styles = {
  container: {
    width: '100%',
    maxWidth: 'var(--container)',
    margin: '0 auto',
    padding: '0 var(--space-xl)',
    boxSizing: 'border-box',
  },
}

export function Container({ children, className = '', as: Component = 'div', style, ...props }) {
  return (
    <Component className={className} style={{ ...styles.container, ...style }} {...props}>
      {children}
    </Component>
  )
}
