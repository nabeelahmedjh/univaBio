import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

/**
 * Renders a session note. All content is sanitised with rehype-sanitize;
 * never use dangerouslySetInnerHTML for medical content.
 */
const components: Components = {
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ),
  input: ({ checked, type }) =>
    type === 'checkbox' ? (
      <input type="checkbox" checked={!!checked} readOnly disabled aria-label={checked ? 'Done' : 'Not done'} />
    ) : null,
}

export function SessionMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="session-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
