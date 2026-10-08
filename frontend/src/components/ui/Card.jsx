/** Card — white bordered card. */
export default function Card({ children, className = '', hover = false, style, ...props }) {
  return (
    <div className={`card ${hover ? 'card--hover' : ''} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}
