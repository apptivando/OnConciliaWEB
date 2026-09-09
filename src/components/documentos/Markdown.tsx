import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renderer de los documentos de /content.
 *
 * Es un Server Component a propósito: el markdown se lee y se renderiza en el
 * servidor, así el contenido interno nunca viaja dentro de un bundle de JS.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-slate-700 text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-navy text-2xl font-bold mt-0 mb-4 leading-tight">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-navy text-lg font-bold mt-10 mb-3 pb-2 border-b border-slate-200 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-navy text-base font-semibold mt-7 mb-2">{children}</h3>
          ),
          p: ({ children }) => <p className="my-3.5">{children}</p>,
          ul: ({ children }) => <ul className="my-3.5 space-y-1.5 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-3.5 space-y-1.5 list-decimal pl-5">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-5 border-l-[3px] border-brand bg-slate-50 rounded-r-lg px-5 py-3 [&>p]:my-2 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-9 border-slate-200" />,
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => (
            <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wider px-4 py-2.5 border-b border-slate-200 align-bottom">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-slate-100 align-top text-slate-700 [&>strong]:text-navy">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 text-navy rounded px-1.5 py-0.5 text-[13px] font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-5 bg-navy text-slate-100 rounded-xl p-4 overflow-x-auto text-[13px] leading-relaxed [&_code]:bg-transparent [&_code]:text-slate-100 [&_code]:p-0">
              {children}
            </pre>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
