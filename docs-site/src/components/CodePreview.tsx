import { useMemo, useState, useEffect } from 'react';
import { highlightCode } from '@/lib/highlight';
import { Maximize2, Minimize2, Check, Copy } from 'lucide-react';

interface CodePreviewProps {
  title: string;
  code: string;
  language?: string;
  children: React.ReactNode;
}

export function CodePreview({ title, code, language = 'tsx', children }: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  return (
    <section className={`code-preview ${isFullscreen ? 'fullscreen-mode' : ''}`}>
      <div className="code-preview-header">
        <div className="preview-tabs">
          <button 
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
        <div className="code-preview-actions">
          {activeTab === 'code' && (
            <button className="ghost-btn icon-btn" type="button" onClick={onCopy} title="Copy code">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button 
            className="ghost-btn icon-btn" 
            type="button" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="code-preview-content">
        <div style={{ display: activeTab === 'preview' ? 'block' : 'none' }}>
          <div className="example-panel">
            {children}
          </div>
        </div>
        {activeTab === 'code' && (
          <div className="code-panel">
            <pre className={`language-${language}`}>
              <code
                className={`language-${language}`}
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
